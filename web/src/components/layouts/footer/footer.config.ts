import { EXTERNAL_LINKS } from "@/config/external-links";
import { routes } from "@/lib/routes";

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterPolicyLink = {
  label: string;
  href: string;
  external?: boolean;
};

export const primaryLinks: FooterLink[] = [
  {
    label: "TOP",
    href: routes.home(),
  },
  {
    label: "議案を検索する",
    href: routes.billsList(),
  },
  {
    label: "定例会の一覧",
    href: routes.gikaiSessions(),
  },
  {
    label: "予算とその使われ方",
    href: routes.finance(),
  },
  {
    label: "沼津市議会（市公式サイト）",
    href: EXTERNAL_LINKS.NUMAZU_COUNCIL,
    external: true,
  },
  {
    label: "自主制作ガイドライン",
    href: EXTERNAL_LINKS.FORK_GUIDELINES_NOTE,
    external: true,
  },
];

export const policyLinks: FooterPolicyLink[] = [
  {
    label: "利用規約",
    href: routes.terms(),
  },
  {
    label: "プライバシーポリシー",
    href: routes.privacy(),
  },
  {
    label: "開発者向け",
    href: routes.developers(),
  },
];
