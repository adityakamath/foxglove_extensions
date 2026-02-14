import { ExtensionContext } from "@foxglove/extension";

import { initButtonPanel } from "./ButtonPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "Button", initPanel: initButtonPanel });
}
