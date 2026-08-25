export default async function dailyQuestionScenario(a, b) {
  await a.getByRole("textbox", { name: "Your name" }).fill("Ari");
  await b.getByRole("textbox", { name: "Your name" }).fill("Bea");
  await a.getByLabel("Your response").fill("A slow cup of coffee before the messages arrive.");
  await a.getByRole("button", { name: "Share today’s answer" }).click();
  await b.waitForTimeout(800);
  await b.getByLabel("Your response").fill("A walk without a destination.");
  await b.getByLabel("Post anonymously").check();
  await b.getByRole("button", { name: "Share today’s answer" }).click();
  await a.waitForTimeout(1200);

  await a.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
  await b.locator(".daily-answers").scrollIntoViewIfNeeded();
  await a.waitForTimeout(400);
}
