import { PanelExtensionContext, SettingsTreeAction } from "@foxglove/extension";
import { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

type Settings = {
  outputMode: "publisher" | "service";
  name: string;
  buttonMode: "toggle" | "push";
  activeColor: string;
  inactiveColor: string;
  activeText: string;
  inactiveText: string;
};

const DEFAULT_SETTINGS: Settings = {
  outputMode: "publisher",
  name: "/button",
  buttonMode: "toggle",
  activeColor: "#10B981",
  inactiveColor: "#EF4444",
  activeText: "",
  inactiveText: "",
};

function Button({ context }: { context: PanelExtensionContext }): ReactElement {
  const [isActive, setIsActive] = useState(false);
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Setup render handling and load settings (runs once)
  useLayoutEffect(() => {
    context.onRender = (_renderState, done) => setRenderDone(() => done);
    context.watch("currentFrame");

    // Load settings
    const saved = context.initialState as Partial<Settings> | undefined;
    if (saved) {
      setSettings((prev) => ({ ...prev, ...saved }));
    }

  }, [context]);

  // Invoke render done callback
  useEffect(() => renderDone?.(), [renderDone]);

  // Update container size
  useLayoutEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  // Update settings panel
  useEffect(() => {
    const actionHandler = (action: SettingsTreeAction) => {
      if (action.action !== "update") return;

      const key = action.payload.path[action.payload.path.length - 1] as keyof Settings;
      const value = action.payload.value;

      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        context.saveState(newSettings);
        if (key === "buttonMode") setIsActive(false);
        if (key === "outputMode" && value === "service") {
          context.unadvertise?.(prev.name);
        }
        return newSettings;
      });
    };

    context.updatePanelSettingsEditor({
      actionHandler,
      nodes: {
        general: {
          label: "General",
          fields: {
            outputMode: {
              label: "Output Mode",
              input: "select",
              value: settings.outputMode,
              options: [
                { label: "Publisher", value: "publisher" },
                { label: "Service Call", value: "service" },
              ],
            },
            name: {
              label: settings.outputMode === "publisher" ? "Topic Name" : "Service Name",
              input: "string",
              value: settings.name,
            },
            buttonMode: {
              label: "Button Type",
              input: "select",
              value: settings.buttonMode,
              options: [
                { label: "Toggle", value: "toggle" },
                { label: "Push", value: "push" },
              ],
            },
          },
        },
        appearance: {
          label: "Appearance",
          children: {
            activeState: {
              label: "Active State",
              fields: {
                activeColor: { label: "Color", input: "rgb", value: settings.activeColor },
                activeText: { label: "Text", input: "string", value: settings.activeText },
              },
            },
            inactiveState: {
              label: "Inactive State",
              fields: {
                inactiveColor: { label: "Color", input: "rgb", value: settings.inactiveColor },
                inactiveText: { label: "Text", input: "string", value: settings.inactiveText },
              },
            },
          },
        },
      },
    });
  }, [context, settings]);

  const triggerOutput = useCallback(
    (state: boolean) => {
      if (settings.outputMode === "publisher") {
        if (settings.name) {
          context.advertise?.(settings.name, "std_msgs/Bool");
          context.publish?.(settings.name, { data: state });
        }
      } else {
        if (settings.name) {
          context.callService?.(settings.name, { data: state })?.catch(console.error);
        }
      }
    },
    [settings.outputMode, settings.name, context]
  );

  const handleButtonClick = useCallback(() => {
    if (settings.buttonMode === "toggle") {
      const newState = !isActive;
      setIsActive(newState);
      triggerOutput(newState);
    }
  }, [settings.buttonMode, isActive, triggerOutput]);

  const handleButtonPress = useCallback(() => {
    if (settings.buttonMode === "push" && !isActive) {
      setIsActive(true);
      triggerOutput(true);
    }
  }, [settings.buttonMode, isActive, triggerOutput]);

  const handleButtonRelease = useCallback(() => {
    if (settings.buttonMode === "push" && isActive) {
      setIsActive(false);
      triggerOutput(false);
    }
  }, [settings.buttonMode, isActive, triggerOutput]);

  const buttonDimensions = useMemo(() => {
    const aspectRatio = 2.5;
    const maxHeight = 116;
    const scaleByHeight = containerSize.height * 0.7;
    const scaleByWidth = (containerSize.width * 0.8) / aspectRatio;
    const height = Math.min(scaleByHeight, scaleByWidth, maxHeight);
    return { width: height * aspectRatio, height };
  }, [containerSize]);

  const buttonStyle = useMemo((): React.CSSProperties => {
    const { width, height } = buttonDimensions;
    const currentColor = isActive ? settings.activeColor : settings.inactiveColor;
    
    // Darken color for gradient
    const num = parseInt(currentColor.replace("#", ""), 16);
    const darken = (val: number) => Math.max(0, val - Math.round(val * 0.15));
    const r = darken(num >> 16);
    const g = darken((num >> 8) & 0xff);
    const b = darken(num & 0xff);
    const darkerColor = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;

    // Shadow color
    const sr = num >> 16;
    const sg = (num >> 8) & 0xff;
    const sb = num & 0xff;

    return {
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: `${height / 16}px`,
      background: `linear-gradient(145deg, ${currentColor}, ${darkerColor})`,
      border: "none",
      cursor: "pointer",
      fontSize: `${height * 0.3}px`,
      color: "white",
      fontWeight: "bold",
      boxShadow: `0 4px 8px rgba(${sr}, ${sg}, ${sb}, 0.15)`,
      transition: "transform 0.15s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };
  }, [buttonDimensions, isActive, settings.activeColor, settings.inactiveColor]);

  const displayText = isActive ? settings.activeText : settings.inactiveText;

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        padding: "0.5rem",
      }}
    >
      <button
        onClick={handleButtonClick}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "scale(0.98)";
          handleButtonPress();
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          handleButtonRelease();
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          handleButtonRelease();
        }}
        onTouchStart={handleButtonPress}
        onTouchEnd={handleButtonRelease}
        style={buttonStyle}
      >
        {displayText}
      </button>
    </div>
  );
}

export function initButtonPanel(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<Button context={context} />);
  return () => root.unmount();
}
