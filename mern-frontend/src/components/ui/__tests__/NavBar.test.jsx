import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import NavBar from "../NavBar";

vi.mock("../../../context/NotificationContext", () => ({
    useNotifications: () => ({
        notifications: [],
        removeNotification: vi.fn(),
        clear: vi.fn(),
    }),
}));

describe("NavBar", () => {
    it("renders the Assistant nav item and highlights it on the assistant route", () => {
        render(
            <MemoryRouter initialEntries={["/assistant"]}>
                <NavBar user={{ name: "Jane Doe" }} onLogout={vi.fn()} />
            </MemoryRouter>
        );

        const assistantLink = screen.getByRole("link", { name: "Assistant" });
        const tasksLink = screen.getByRole("link", { name: "Tasks" });

        expect(assistantLink).toBeInTheDocument();
        expect(assistantLink).toHaveClass("bg-zinc-800");
        expect(tasksLink).not.toHaveClass("bg-zinc-800");
    });
});
