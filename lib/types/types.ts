export type UsageRequest = {
    action: "installation" | "uninstallation" | "update",
    version: string,
    beta?: boolean
}