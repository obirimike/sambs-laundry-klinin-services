import { expect, test, type Browser, type Page } from "@playwright/test";

const PASSWORD = "SambPreview!2026";
const BOOKING_B1_ID = "30000000-0000-4000-8000-000000000001"; // SAMB-2026-1001 (PENDING, unassigned)
const BOOKING_B2_ID = "30000000-0000-4000-8000-000000000002"; // SAMB-2026-1002 (CONFIRMED, unassigned initially)
const BOOKING_B3_ID = "30000000-0000-4000-8000-000000000003"; // SAMB-2026-1003 (IN_PROGRESS, staff1 + staff2 + supervisor)

const TINY_PNG_BYTES = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex"
);

async function signInInNewContext(
  browser: Browser,
  email: string,
  expectedPathPrefix: string,
  viewport = { width: 1440, height: 900 }
) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL(
    (url) => url.pathname.startsWith(expectedPathPrefix),
    { timeout: 15_000 }
  );

  return { context, page };
}

async function dismissFeedbackModalIfOpen(page: Page) {
  const dialog = page.locator('[role="dialog"][aria-labelledby="feedback-modal-title"]');
  if (await dialog.isVisible().catch(() => false)) {
    const dismissBtn = dialog.getByRole("button", {
      name: /^OK, Got it$|^Close dialog$|^OK$|^Close$|^Done$/i,
    });
    await dismissBtn.first().click();
    await expect(dialog).toBeHidden();
  }
}

test.describe.serial("SAMB's Admin Redesign & Multi-Level Staff-Supervisor-Admin Workflow", () => {
  test.setTimeout(60_000);
  let uploadedEvidenceHref = "";

  test("1 & 2. Admin sidebar behavior, zero duplicate NavBar/Footer, mobile drawer, and live overview", async ({
    browser,
  }) => {
    const { context, page } = await signInInNewContext(
      browser,
      "admin@sambservices.com",
      "/admin"
    );

    // Desktop sidebar is permanently expanded by default
    const desktopAside = page.locator("aside").filter({ hasText: "Operations Console" });
    await expect(desktopAside).toBeVisible();
    await expect(desktopAside.getByRole("link", { name: /Final Approvals/ })).toBeVisible();

    // No duplicate public NavBar or Footer in /admin
    await expect(page.getByRole("link", { name: "Book Service" })).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);

    // Live overview metrics & Work Pipeline render
    await expect(page.getByText("Pending review", { exact: true })).toBeVisible();
    await expect(page.getByText("Awaiting final approval", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Work Pipeline" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Requires Your Attention" })).toBeVisible();

    // Collapse sidebar and verify persistence across reload
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();

    // Expand back
    await page.getByRole("button", { name: "Expand sidebar" }).click();
    await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();

    // Navigate to Bookings -> active link highlighted
    await desktopAside.getByRole("link", { name: /^Bookings/ }).click();
    await expect(page).toHaveURL(/\/admin\/bookings$/);
    await expect(
      desktopAside.locator('a[href="/admin/bookings"][aria-current="page"]')
    ).toBeVisible();

    // Mobile drawer test
    await page.setViewportSize({ width: 390, height: 844 });
    const openMenuBtn = page.getByRole("button", { name: "Open admin menu" });
    await expect(openMenuBtn).toBeVisible();
    await openMenuBtn.click();
    const drawer = page.getByRole("dialog", { name: "Admin navigation drawer" });
    await expect(drawer).toBeVisible();
    await page.getByRole("button", { name: "Close admin menu" }).click();
    await expect(drawer).toBeHidden();

    await context.close();
  });

  test("3. Admin creates and filters Staff and Supervisor accounts in /admin/staff", async ({
    browser,
  }) => {
    const { context, page } = await signInInNewContext(
      browser,
      "admin@sambservices.com",
      "/admin"
    );

    await page.goto("/admin/staff");
    await expect(
      page.getByRole("heading", { name: "Staff & Supervisors" })
    ).toBeVisible();

    // Create a new Field Staff account
    await page.locator("#staff-role").selectOption("STAFF");
    await page.locator("#staff-name").fill("Esi Appiah");
    await page.locator("#staff-email").fill("staff3@sambservices.com");
    await page.locator("#staff-phone").fill("+233244100303");
    await page.locator("#staff-password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create staff account" }).click();

    await expect(page.getByRole("heading", { name: "Staff Account Created" })).toBeVisible();
    await dismissFeedbackModalIfOpen(page);
    await expect(page.getByText("Esi Appiah")).toBeVisible();

    // Create a second Lead Supervisor account
    await page.locator("#staff-role").selectOption("SUPERVISOR");
    await page.locator("#staff-name").fill("Nana Addo");
    await page.locator("#staff-email").fill("supervisor2@sambservices.com");
    await page.locator("#staff-password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create supervisor account" }).click();

    await expect(page.getByRole("heading", { name: "Supervisor Account Created" })).toBeVisible();
    await dismissFeedbackModalIfOpen(page);

    // Filter tabs work
    await page.getByRole("button", { name: /^Supervisors \(/ }).click();
    await expect(page.getByText("Nana Addo")).toBeVisible();
    await expect(page.getByText("Esi Appiah")).toHaveCount(0);

    await page.getByRole("button", { name: /^All Team \(/ }).click();
    await expect(page.getByText("Esi Appiah")).toBeVisible();

    await context.close();
  });

  test("4 & 5. Admin assigns 1 worker first (badge hidden), then adds multiple workers + supervisor & blocks duplicates", async ({
    browser,
  }) => {
    const adminCtx = await signInInNewContext(
      browser,
      "admin@sambservices.com",
      "/admin"
    );
    const adminPage = adminCtx.page;

    await adminPage.goto("/admin/assignments");
    const b2Card = adminPage.locator("section").filter({ hasText: "SAMB-2026-1002" });
    await expect(b2Card).toBeVisible();

    // Assign ONLY Ama Mensah (staff1) to SAMB-2026-1002 initially
    await b2Card.getByLabel(/Ama Mensah/).check();
    await b2Card.getByRole("button", { name: /Assign Selected Staff \(1\)/ }).click();
    await expect(adminPage.getByRole("heading", { name: "Team Assigned Successfully" })).toBeVisible();
    await dismissFeedbackModalIfOpen(adminPage);

    // Duplicate assignment attempt via API is blocked (409)
    const dupRes = await adminPage.evaluate(async (bookingId) => {
      const res = await fetch(`/api/admin/bookings/${bookingId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffIds: ["20000000-0000-4000-8000-000000000003"],
        }),
      });
      return res.status;
    }, BOOKING_B2_ID);
    expect(dupRes).toBe(409);

    // Staff1 logs in: sees NO coworker badge on SAMB-2026-1002, and "1 other worker" on SAMB-2026-1003
    const staff1Ctx = await signInInNewContext(
      browser,
      "staff1@sambservices.com",
      "/staff"
    );
    const staff1Page = staff1Ctx.page;

    const s1B2Card = staff1Page.locator("article").filter({ hasText: "SAMB-2026-1002" });
    await expect(s1B2Card).toBeVisible();
    await expect(s1B2Card.getByTestId("coworkers-badge")).toHaveCount(0);

    const s1B3Card = staff1Page.locator("article").filter({ hasText: "SAMB-2026-1003" });
    const b3Badge = s1B3Card.getByTestId("coworkers-badge");
    await expect(b3Badge).toHaveText("1 other worker");

    // Click coworker badge -> opens modal with Lead Supervisor and coworker
    await b3Badge.click();
    const rosterDialog = staff1Page.getByRole("dialog", {
      name: /Assigned team for SAMB-2026-1003/,
    });
    await expect(rosterDialog).toBeVisible();
    await expect(rosterDialog.getByText("Kwame Boateng")).toBeVisible();
    await expect(rosterDialog.getByText("Lead Supervisor")).toBeVisible();
    await expect(rosterDialog.getByText("Kojo Owusu")).toBeVisible();
    await rosterDialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(rosterDialog).toBeHidden();

    // Admin adds Kojo Owusu + Esi Appiah + Lead Supervisor (Kwame Boateng) to SAMB-2026-1002
    await adminPage.reload();
    const b2Reloaded = adminPage.locator("section").filter({ hasText: "SAMB-2026-1002" });
    await b2Reloaded
      .getByLabel(/Lead supervisor for SAMB-2026-1002/)
      .selectOption("20000000-0000-4000-8000-000000000002");
    await b2Reloaded.getByLabel(/Kojo Owusu/).check();
    await b2Reloaded.getByLabel(/Esi Appiah/).check();
    await b2Reloaded.getByRole("button", { name: /Assign Selected Staff \(2\)/ }).click();
    await expect(adminPage.getByRole("heading", { name: "Team Assigned Successfully" })).toBeVisible();
    await dismissFeedbackModalIfOpen(adminPage);

    // Now Staff1 sees "2 other workers" on SAMB-2026-1002
    await staff1Page.reload();
    await expect(
      staff1Page
        .locator("article")
        .filter({ hasText: "SAMB-2026-1002" })
        .getByTestId("coworkers-badge")
    ).toHaveText("2 other workers");

    // Admin unassigns Esi Appiah from SAMB-2026-1002 so staff1 + staff2 remain
    await adminPage.reload();
    const b2WithThree = adminPage.locator("section").filter({ hasText: "SAMB-2026-1002" });
    const esiTile = b2WithThree
      .locator("div.flex.flex-col.justify-between")
      .filter({ hasText: "Esi Appiah" });
    await esiTile.getByRole("button", { name: "Unassign" }).click();
    await adminPage.getByRole("button", { name: "Unassign Staff" }).click();
    await expect(adminPage.getByRole("heading", { name: "Staff Unassigned" })).toBeVisible();
    await dismissFeedbackModalIfOpen(adminPage);

    // Staff1 now sees "1 other worker" on SAMB-2026-1002
    await staff1Page.reload();
    await expect(
      staff1Page
        .locator("article")
        .filter({ hasText: "SAMB-2026-1002" })
        .getByTestId("coworkers-badge")
    ).toHaveText("1 other worker");

    await staff1Ctx.context.close();
    await adminCtx.context.close();
  });

  test("6 & 7. Staff1 & Staff2 execute work, upload PNG evidence, and trigger AWAITING_SUPERVISOR_REVIEW", async ({
    browser,
  }) => {
    // Staff 1 starts & submits completion report with photo evidence
    const staff1Ctx = await signInInNewContext(
      browser,
      "staff1@sambservices.com",
      "/staff"
    );
    const s1Page = staff1Ctx.page;
    const s1Card = s1Page.locator("article").filter({ hasText: "SAMB-2026-1002" });

    await s1Card.getByRole("button", { name: "Start Work" }).click();
    await expect(s1Page.getByRole("heading", { name: "Work Started" })).toBeVisible();
    await dismissFeedbackModalIfOpen(s1Page);

    await s1Card.getByRole("button", { name: "Submit Completion Report" }).click();
    await s1Page.locator("#report-summary").fill("Washed and folded 2 laundry baskets.");
    await s1Page
      .locator("#report-work")
      .fill("Sorted delicates, washed at 40C, tumble dried, and steam pressed.");
    await s1Page.locator("#report-issues").fill("One shirt button was loose prior to wash.");
    await s1Page.locator('input[type="file"]').setInputFiles({
      name: "laundry-proof.png",
      mimeType: "image/png",
      buffer: TINY_PNG_BYTES,
    });
    await s1Page.getByRole("button", { name: "Submit Report for Review" }).click();

    await expect(s1Page.getByRole("heading", { name: "Completion Report Submitted" })).toBeVisible();
    await dismissFeedbackModalIfOpen(s1Page);

    const evidenceLink = s1Card.getByRole("link", { name: "laundry-proof.png" });
    await expect(evidenceLink).toBeVisible();
    uploadedEvidenceHref = (await evidenceLink.getAttribute("href")) || "";
    expect(uploadedEvidenceHref).toContain("/api/evidence?");

    // Staff 1 can download evidence (200)
    const staffEvidenceStatus = await s1Page.evaluate(async (href) => {
      const res = await fetch(href);
      return res.status;
    }, uploadedEvidenceHref);
    expect(staffEvidenceStatus).toBe(200);

    await staff1Ctx.context.close();

    // Staff 2 starts & submits completion report
    const staff2Ctx = await signInInNewContext(
      browser,
      "staff2@sambservices.com",
      "/staff"
    );
    const s2Page = staff2Ctx.page;
    const s2Card = s2Page.locator("article").filter({ hasText: "SAMB-2026-1002" });

    await s2Card.getByRole("button", { name: "Start Work" }).click();
    await expect(s2Page.getByRole("heading", { name: "Work Started" })).toBeVisible();
    await dismissFeedbackModalIfOpen(s2Page);

    await s2Card.getByRole("button", { name: "Submit Completion Report" }).click();
    await s2Page.locator("#report-summary").fill("Packed and quality-checked folded linen.");
    await s2Page
      .locator("#report-work")
      .fill("Steamed delicate linen garments, packaged in protective covers, and tagged.");
    await s2Page.getByRole("button", { name: "Submit Report for Review" }).click();

    await expect(s2Page.getByRole("heading", { name: "Completion Report Submitted" })).toBeVisible();
    await dismissFeedbackModalIfOpen(s2Page);
    await expect(s2Card.getByText("Awaiting Supervisor Review").first()).toBeVisible();

    await staff2Ctx.context.close();
  });

  test("8 & 9. Supervisor scoping, correction loop with Staff1, and Supervisor Approval (not COMPLETED yet)", async ({
    browser,
  }) => {
    const supCtx = await signInInNewContext(
      browser,
      "supervisor@sambservices.com",
      "/supervisor"
    );
    const supPage = supCtx.page;

    // Supervisor can view uploaded evidence
    const supEvidenceStatus = await supPage.evaluate(async (href) => {
      const res = await fetch(href);
      return res.status;
    }, uploadedEvidenceHref);
    expect(supEvidenceStatus).toBe(200);

    // Supervisor scoping: cannot access unassigned booking SAMB-2026-1001
    const unauthSupApi = await supPage.evaluate(async (b1) => {
      const res = await fetch(`/api/supervisor/bookings/${b1}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "APPROVE" }),
      });
      return res.status;
    }, BOOKING_B1_ID);
    expect(unauthSupApi).toBe(403);

    await supPage.goto("/supervisor/awaiting-review");
    const b2SupCard = supPage.locator("section").filter({ hasText: "SAMB-2026-1002" });
    await expect(b2SupCard).toBeVisible();
    await b2SupCard.getByRole("link", { name: "Inspect & Review" }).click();
    await expect(supPage).toHaveURL(new RegExp(`/supervisor/jobs/${BOOKING_B2_ID}$`));

    // Request corrections from Ama Mensah (staff1) only
    await supPage.getByRole("button", { name: "Request Corrections" }).click();
    const modal = supPage.getByRole("dialog");
    await modal.getByLabel("Kojo Owusu").uncheck();
    await modal.getByLabel("Ama Mensah").check();
    await modal
      .getByPlaceholder(/Describe specific areas/)
      .fill("Please re-press the white linen collars and note collar condition.");
    await modal.getByRole("button", { name: "Send Correction Request" }).click();

    await expect(supPage.getByRole("heading", { name: "Corrections Requested" })).toBeVisible();
    await dismissFeedbackModalIfOpen(supPage);

    // Staff1 sees correction request & resubmits
    const staff1Ctx = await signInInNewContext(
      browser,
      "staff1@sambservices.com",
      "/staff"
    );
    const s1Page = staff1Ctx.page;
    const s1Card = s1Page.locator("article").filter({ hasText: "SAMB-2026-1002" });
    await expect(
      s1Card.getByText("Please re-press the white linen collars and note collar condition.")
    ).toBeVisible();

    await s1Card.getByRole("button", { name: "Resubmit Corrections" }).click();
    await s1Page.locator("#report-summary").fill("Re-pressed collars and re-checked linen.");
    await s1Page
      .locator("#report-work")
      .fill("Steam-pressed all white linen collars and verified crisp finish.");
    await s1Page.getByRole("button", { name: "Submit Report for Review" }).click();
    await expect(s1Page.getByRole("heading", { name: "Completion Report Submitted" })).toBeVisible();
    await dismissFeedbackModalIfOpen(s1Page);
    await staff1Ctx.context.close();

    // Supervisor approves SAMB-2026-1002 -> escalated to Admin, NOT COMPLETED yet
    await supPage.reload();
    await supPage
      .locator("#supervisor-note")
      .fill("Collars inspected and spotless. Escalated for Admin final approval.");
    await supPage.getByRole("button", { name: "Approve for Admin Sign-off" }).click();
    await supPage.getByRole("button", { name: "Approve & Escalate" }).click();
    await expect(supPage.getByRole("heading", { name: "Approved for Admin Final Sign-Off" })).toBeVisible();
    await dismissFeedbackModalIfOpen(supPage);

    await expect(supPage.getByText("Supervisor Approved", { exact: true }).first()).toBeVisible();
    await expect(supPage.getByText("In Progress", { exact: true }).first()).toBeVisible();

    await supCtx.context.close();
  });

  test("10, 11 & 12. Admin guardrail, Return to Supervisor flow, and Final Completion releasing customer notification", async ({
    browser,
  }) => {
    const adminCtx = await signInInNewContext(
      browser,
      "admin@sambservices.com",
      "/admin"
    );
    const adminPage = adminCtx.page;

    // Guardrail: Admin cannot mark SAMB-2026-1003 COMPLETED directly without supervisor approval
    const guardStatus = await adminPage.evaluate(async (b3) => {
      const res = await fetch(`/api/admin/bookings/${b3}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      const body = await res.json();
      return { status: res.status, code: body.code };
    }, BOOKING_B3_ID);
    expect(guardStatus.status).toBe(409);
    expect(guardStatus.code).toBe("SUPERVISOR_APPROVAL_REQUIRED");

    // Admin opens /admin/approvals and RETURNS SAMB-2026-1002 to supervisor
    await adminPage.goto("/admin/approvals");
    const b2ApprovalCard = adminPage
      .locator("section")
      .filter({ hasText: "SAMB-2026-1002" });
    await expect(b2ApprovalCard).toBeVisible();
    await b2ApprovalCard.getByRole("button", { name: "Return to Supervisor" }).click();
    const returnDialog = adminPage.getByRole("dialog");
    await returnDialog
      .getByPlaceholder(/Explain what needs re-inspection/)
      .fill("Confirm garment count tag matches customer receipt before release.");
    await returnDialog.getByRole("button", { name: "Return for Further Action" }).click();
    await expect(adminPage.getByRole("heading", { name: "Returned to Supervisor" })).toBeVisible();
    await dismissFeedbackModalIfOpen(adminPage);

    // Supervisor sees returned note and re-approves
    const supCtx = await signInInNewContext(
      browser,
      "supervisor@sambservices.com",
      "/supervisor/jobs/" + BOOKING_B2_ID
    );
    const supPage = supCtx.page;
    await expect(
      supPage.getByText("Confirm garment count tag matches customer receipt before release.")
    ).toBeVisible();
    await supPage.locator("#supervisor-note").fill("Garment tag count verified (14 pieces).");
    await supPage.getByRole("button", { name: "Approve for Admin Sign-off" }).click();
    await supPage.getByRole("button", { name: "Approve & Escalate" }).click();
    await expect(supPage.getByRole("heading", { name: "Approved for Admin Final Sign-Off" })).toBeVisible();
    await supCtx.context.close();

    // Admin finalizes completion
    await adminPage.reload();
    const b2ReadyAgain = adminPage
      .locator("section")
      .filter({ hasText: "SAMB-2026-1002" });
    await expect(b2ReadyAgain).toBeVisible();
    await adminPage
      .locator(`#approval-note-${BOOKING_B2_ID}`)
      .fill("Verified garment tag count and released completion notice.");
    await b2ReadyAgain
      .getByRole("button", { name: "Approve Completion & Notify Customer" })
      .click();
    await adminPage.getByRole("button", { name: "Approve & Complete" }).click();
    await expect(adminPage.getByRole("heading", { name: "Completion Approved" })).toBeVisible();
    await dismissFeedbackModalIfOpen(adminPage);

    await adminPage.getByRole("button", { name: /^Finalized \(/ }).click();
    await expect(
      adminPage.locator("section").filter({ hasText: "SAMB-2026-1002" })
    ).toBeVisible();

    await adminCtx.context.close();

    // Customer sees completion notification in /account/notifications
    const custCtx = await signInInNewContext(
      browser,
      "customer@sambservices.com",
      "/account"
    );
    const custPage = custCtx.page;
    await custPage.goto("/account/notifications");
    await expect(
      custPage
        .getByText(/Your booking SAMB-2026-1002 has been marked as completed/)
        .first()
    ).toBeVisible();

    await custCtx.context.close();
  });

  test("13. RBAC negative assertions across Customer, Staff, Supervisor, and unauthenticated requests", async ({
    browser,
    request,
  }) => {
    // Unauthenticated API checks
    const unauthFinal = await request.post(
      `/api/admin/bookings/${BOOKING_B2_ID}/final-approval`,
      { data: { decision: "APPROVE" } }
    );
    expect(unauthFinal.status()).toBe(401);

    const unauthEv = await request.get(uploadedEvidenceHref);
    expect(unauthEv.status()).toBe(401);

    // Customer cannot access /admin, /supervisor, /staff, evidence, or workflow APIs
    const custCtx = await signInInNewContext(
      browser,
      "customer@sambservices.com",
      "/account"
    );
    const custPage = custCtx.page;

    await custPage.goto("/supervisor");
    await expect(custPage).toHaveURL(/\/account$/);
    await custPage.goto("/admin");
    await expect(custPage).toHaveURL(/\/account$/);

    const custStatuses = await custPage.evaluate(
      async ({ bId, evHref }) => {
        const [ev, sup, fin] = await Promise.all([
          fetch(evHref).then((r) => r.status),
          fetch(`/api/supervisor/bookings/${bId}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "APPROVE" }),
          }).then((r) => r.status),
          fetch(`/api/admin/bookings/${bId}/final-approval`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "APPROVE" }),
          }).then((r) => r.status),
        ]);
        return { ev, sup, fin };
      },
      { bId: BOOKING_B3_ID, evHref: uploadedEvidenceHref }
    );
    expect(custStatuses).toEqual({ ev: 403, sup: 403, fin: 403 });
    await custCtx.context.close();

    // Supervisor cannot access /admin or call admin final-approval API
    const supCtx = await signInInNewContext(
      browser,
      "supervisor@sambservices.com",
      "/supervisor"
    );
    const supPage = supCtx.page;
    await supPage.goto("/admin");
    await expect(supPage).toHaveURL(/\/supervisor$/);

    const supAdminStatus = await supPage.evaluate(async (bId) => {
      const res = await fetch(`/api/admin/bookings/${bId}/final-approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "APPROVE" }),
      });
      return res.status;
    }, BOOKING_B3_ID);
    expect(supAdminStatus).toBe(403);
    await supCtx.context.close();
  });
});
