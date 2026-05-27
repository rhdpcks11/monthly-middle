import { Shell } from "@/components/Shell";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "mentor" && session.role !== "admin") redirect("/");

  const isAdmin = session.role === "admin";
  return (
    <Shell
      role={isAdmin ? "admin" : "mentor"}
      who={isAdmin ? "관리자 (학생 조회)" : session.mentorName || "멘토"}
      nav={
        isAdmin
          ? [
              { href: "/admin", label: "관리자 홈" },
              { href: "/admin/students", label: "학생 관리" },
            ]
          : [{ href: "/mentor", label: "내 학생" }]
      }
    >
      {children}
    </Shell>
  );
}
