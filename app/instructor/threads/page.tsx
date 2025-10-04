import { redirect } from "next/navigation";

export default function InstructorThreadsPage() {
  // Redirect to courses dashboard (course-centric architecture)
  redirect("/courses");
}
