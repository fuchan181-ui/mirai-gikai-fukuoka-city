// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DesktopNavigation } from "./desktop-navigation";

describe("DesktopNavigation", () => {
  it("主要ページへのリンクを表示する", () => {
    render(<DesktopNavigation pathname="/" />);

    const nav = screen.getByRole("navigation", { name: "メインメニュー" });
    expect(nav).toHaveClass("hidden", "xl:block");
    const links = nav.querySelectorAll("a");
    expect(
      [...links].map((link) => [link.textContent, link.getAttribute("href")])
    ).toEqual([
      ["トップ", "/"],
      ["議案を検索する", "/bills"],
      ["定例会の一覧", "/gikai"],
    ]);
  });

  it("現在のセクションを示す", () => {
    render(<DesktopNavigation pathname="/gikai/2026-13/bills" />);

    expect(screen.getByRole("link", { name: "定例会の一覧" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "トップ" })).not.toHaveAttribute(
      "aria-current"
    );
  });
});
