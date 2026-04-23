import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AssistantPage from "../AssistantPage";

function renderAssistantPage(overrides = {}) {
    const props = {
        activeIntent: null,
        currentUserId: "user-1",
        inputValue: "",
        isConversationLoading: false,
        isSending: false,
        messages: [],
        onConfirmTask: vi.fn(),
        onInputChange: vi.fn(),
        onPromptClick: vi.fn(),
        onResetConversation: vi.fn(),
        onSubmit: vi.fn((event) => event.preventDefault()),
        pendingTaskProposal: null,
        ...overrides,
    };

    render(<AssistantPage {...props} />);
    return props;
}

describe("AssistantPage", () => {
    it("renders the empty state with starter prompts and composer", () => {
        renderAssistantPage();

        expect(screen.getByText("Enter TaskFlow's AI layer")).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/message the assistant/i)).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /what should i work on today\?/i })[0]).toBeInTheDocument();
    });

    it("renders chat messages and shows the sending state", () => {
        renderAssistantPage({
            isSending: true,
            messages: [
                { role: "user", content: "Create a task for the release notes" },
                { role: "model", content: "I can help structure that for you." },
            ],
        });

        expect(screen.getByText("Create a task for the release notes")).toBeInTheDocument();
        expect(screen.getByText("I can help structure that for you.")).toBeInTheDocument();
        expect(screen.getByText("TaskFlow AI is composing a response...")).toBeInTheDocument();
    });

    it("renders the pending task proposal card and wires confirm actions", () => {
        const onConfirmTask = vi.fn();
        renderAssistantPage({
            currentUserId: "user-1",
            messages: [{ role: "model", content: "Here's the task I've structured for you. Does this look right?" }],
            onConfirmTask,
            pendingTaskProposal: {
                title: "Fix login bug",
                priority: "High",
                dueDate: "2026-04-25",
                assignee: "user-1",
                tags: ["auth"],
            },
        });

        fireEvent.click(screen.getByRole("button", { name: /confirm task/i }));
        fireEvent.click(screen.getByRole("button", { name: /refine proposal/i }));

        expect(screen.getByText("Pending Task Proposal")).toBeInTheDocument();
        expect(screen.getByText("Personal task")).toBeInTheDocument();
        expect(onConfirmTask).toHaveBeenNthCalledWith(1, true);
        expect(onConfirmTask).toHaveBeenNthCalledWith(2, false);
    });

    it("submits and resets conversation through the provided callbacks", () => {
        const onSubmit = vi.fn((event) => event.preventDefault());
        const onResetConversation = vi.fn();
        const onInputChange = vi.fn();

        renderAssistantPage({
            inputValue: "",
            onInputChange,
            onResetConversation,
            onSubmit,
        });

        fireEvent.change(screen.getByPlaceholderText(/message the assistant/i), {
            target: { value: "Draft a release checklist" },
        });
        fireEvent.click(screen.getByRole("button", { name: /new conversation/i }));
        fireEvent.submit(screen.getByRole("button", { name: /send message/i }).closest("form"));

        expect(onInputChange).toHaveBeenCalledWith("Draft a release checklist");
        expect(onResetConversation).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});
