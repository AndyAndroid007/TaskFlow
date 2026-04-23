import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../pages/LoginPage", () => ({
    default: () => <div>Login Page</div>,
}));

vi.mock("../pages/TaskDashboard", () => ({
    default: () => <div>Task Dashboard</div>,
}));

vi.mock("../pages/AnalyticsDashboard", () => ({
    default: () => <div>Analytics Dashboard</div>,
}));

vi.mock("../pages/AssistantDashboard", () => ({
    default: () => <div>Assistant Dashboard</div>,
}));

vi.mock("../context/NotificationContext", () => ({
    NotificationProvider: ({ children }) => <>{children}</>,
}));

describe("App routes", () => {
    beforeEach(() => {
        window.history.pushState({}, "", "/assistant");
        localStorage.clear();
    });

    it("renders the assistant route", async () => {
        const { default: App } = await import("../App");

        render(<App />);

        expect(screen.getByText("Assistant Dashboard")).toBeInTheDocument();
    });
});
