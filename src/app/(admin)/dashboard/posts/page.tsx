import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Page() {
  return (
    <div className="flex items-center justify-start mb-6">
      <h1 className="font-bold text-2xl mr-4">Posts</h1>
      <Link href="/dashboard/posts/new">
        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
          <Plus size={18} />
          Add New Post
        </Button>
      </Link>
    </div>
  );
}
