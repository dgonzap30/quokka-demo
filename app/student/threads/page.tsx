import { redirect } from "next/navigation";

export default function StudentThreadsPage() {
  // Redirect to courses dashboard (course-centric architecture)
  redirect("/courses");
}
