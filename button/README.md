# Button Extension

A Foxglove extension that provides a configurable toggle or push button for sending boolean commands to ROS 2 systems.

### Features

- **Output Modes:**
  - **Publisher**: Publishes `std_msgs/Bool` messages on state change
  - **Service Call**: Calls `std_srvs/SetBool` service on state change

- **Button Types:**
  - **Toggle**: Click to switch states (latching)
  - **Push**: Active while held (momentary)

- **Appearance:** Configurable colors and text labels for each state

## Configuration

Access the panel settings (gear icon) to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| **Output Mode** | Choose between `Publisher` (topic) or `Service Call` | `Publisher` |
| **Topic/Service Name** | The ROS 2 topic or service name | `/button` |
| **Button Type** | `Toggle` (latching) or `Push` (momentary) | `Toggle` |
| **Active Color** | Color when button is in active state | Green (#10B981) |
| **Inactive Color** | Color when button is in inactive state | Red (#EF4444) |
| **Active Text** | Optional label shown in active state | (empty) |
| **Inactive Text** | Optional label shown in inactive state | (empty) |

## Installation

**From releases:** Download the `.foxe` file → **Extensions** → **Install Extension** in Foxglove

**From source:**
```sh
cd foxglove_extensions/button
npm install && npm run local-install
```

Restart Foxglove (`Ctrl+R` / `Cmd+R`) and add the Button panel.

## Develop

Install dependencies and build:

```sh
npm install
npm run local-install
```

Refresh Foxglove (`Ctrl+R`) to see changes.

### Development Tips

- **Hot Reload**: Changes require rebuilding (`npm run local-install`) and refreshing Foxglove (`Ctrl+R`)
- **Debugging**: Open Foxglove DevTools (**Help** → **Toggle Developer Tools**) to see console logs
- **State Persistence**: Button settings are saved per-layout and persist across sessions
- **Testing**: Configure the button with a test topic and use `ros2 topic echo` to verify output

## License

This extension is licensed under the Apache License 2.0.

## Support

Create an issue on the repository or contact [Kamath Robotics](https://kamathrobotics.com).

---

**Keywords**: button, control, boolean, publisher, service, toggle, push, ros, ros2, foxglove
