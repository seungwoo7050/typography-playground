"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMagnetic } from "@/lib/motion/magnetic";

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ href, active, children }: NavLinkProps) {
  const ref = useMagnetic<HTMLAnchorElement>();
  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "text-ink"
          : "text-graphite transition-colors hover:text-ink"
      }
    >
      {children}
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 pt-8 text-sm">
      <NavLink href="/" active={pathname === "/"}>
        유니코드 생성기
      </NavLink>
      <NavLink href="/kinetic" active={pathname === "/kinetic"}>
        키네틱 엔진
      </NavLink>
    </nav>
  );
}
