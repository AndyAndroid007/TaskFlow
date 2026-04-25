describe("Assistant Flow", () => {
    beforeEach(() => {
        // Register and login a fresh user
        const uniqueEmail = `testuser_${Date.now()}@example.com`;
        cy.visit("/");
        cy.get("button").contains("Sign up").click();
        cy.get("input[type='text']").type("Test User");
        cy.get("input[type='email']").type(uniqueEmail);
        cy.get("input[type='password']").type("password123");
        cy.get("button[type='submit']").click();

        // Once logged in, navigate to assistant
        cy.get("nav").contains("Assistant").click();
    });

    it("should load the assistant empty state", () => {
        cy.contains("TaskFlow AI").should("be.visible");
        cy.contains("How can I help you today?").should("be.visible");
        cy.get("textarea").should(
            "have.attr",
            "placeholder"
        ).and("include", "Message TaskFlow AI");
    });

    it("should send a general chat message and display AI response", () => {
        cy.intercept("POST", "/api/ai/chat").as("chatRequest");

        cy.contains("TaskFlow AI").should("be.visible");

        cy.get("textarea").type("Hello!{enter}");

        cy.wait("@chatRequest").then((interception) => {
            expect(interception.response.statusCode).to.eq(200);
            expect(interception.response.body.reply).to.be.a("string");
        });

        cy.contains("TaskFlow AI").should("be.visible");
    });

    it("should display a task proposal when creating a task", () => {
        cy.intercept("POST", "/api/ai/chat").as("chatRequest");

        cy.get("textarea").type("Remind me to review the PR tomorrow{enter}");

        cy.wait("@chatRequest");

        // The task proposal card should become visible
        cy.contains("Pending Task Proposal").should("be.visible");
        cy.contains("Confirm Task").should("be.visible");
    });

    it("should allow confirming a task proposal and navigate to dashboard to see it", () => {
        cy.intercept("POST", "/api/ai/chat", {
            statusCode: 200,
            body: {
                intent: "CREATE_TASK",
                reply: "Here is the proposal.",
                taskProposal: {
                    title: "Mock Task E2E",
                    priority: "High",
                    dueDate: new Date().toISOString(),
                    tags: ["mock"],
                },
            },
        }).as("chatRequest");

        // Use the correct confirm-task endpoint
        cy.intercept("POST", "/api/ai/confirm-task").as("confirmRequest");

        cy.get("textarea").type("Make a mock task{enter}");
        cy.wait("@chatRequest");

        // Confirm the task
        cy.contains("Confirm Task").click();
        cy.wait("@confirmRequest").its("response.statusCode").should("eq", 200);

        cy.contains("AI task confirmed and created successfully").should("be.visible");

        // Navigate to the Dashboard to verify it appears
        cy.get("nav").contains("Tasks").click();
        cy.contains("Mock Task E2E").should("be.visible");
    });

    it("should allow resetting the conversation", () => {
        cy.intercept("DELETE", "/api/ai/conversation").as("clearRequest");

        cy.contains("Reset Conversation").click();
        cy.wait("@clearRequest").its("response.statusCode").should("eq", 200);
    });
});
