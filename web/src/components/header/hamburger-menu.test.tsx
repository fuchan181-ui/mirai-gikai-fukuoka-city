// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HamburgerMenu } from "./hamburger-menu";

vi.mock("./display-settings", () => ({
  DisplaySettingsControls: () => <div>表示コントロール</div>,
}));

describe("HamburgerMenu", () => {
  it("デスクトップ幅ではメニューボタンを非表示にする", () => {
    render(<HamburgerMenu />);

    expect(screen.getByRole("button", { name: "メニューを開く" })).toHaveClass(
      "xl:hidden"
    );
  });

  it("開くと主要ページへのリンクが並ぶ", async () => {
    render(<HamburgerMenu />);
    await userEvent.click(
      screen.getByRole("button", { name: "メニューを開く" })
    );

    const nav = screen.getByRole("navigation", { name: "メインメニュー" });
    const links = nav.querySelectorAll("a");
    expect(
      [...links].map((a) => [a.textContent, a.getAttribute("href")])
    ).toEqual([
      ["トップ", "/"],
      ["議案を検索する", "/bills"],
      ["定例会の一覧", "/gikai"],
    ]);
    expect(screen.getByText("表示設定")).toBeInTheDocument();
    expect(screen.getByText("表示コントロール")).toBeInTheDocument();
  });

  it("リンクを押すとメニューが閉じる", async () => {
    render(<HamburgerMenu />);
    await userEvent.click(
      screen.getByRole("button", { name: "メニューを開く" })
    );
    await userEvent.click(screen.getByRole("link", { name: "定例会の一覧" }));

    expect(
      screen.queryByRole("navigation", { name: "メインメニュー" })
    ).not.toBeInTheDocument();
  });
});
