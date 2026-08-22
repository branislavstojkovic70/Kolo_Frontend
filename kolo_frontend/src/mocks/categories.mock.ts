import type { Category } from "../types";

export const mockCategories: Category[] = [
	{ id: "c-web", name: "Web Development" },
	{ id: "c-frontend", name: "Frontend", parentId: "c-web" },
	{ id: "c-backend", name: "Backend & APIs", parentId: "c-web" },
	{ id: "c-design", name: "Design" },
	{ id: "c-ui", name: "UI/UX Design", parentId: "c-design" },
	{ id: "c-seo", name: "SEO & Marketing" },
	{ id: "c-devops", name: "DevOps & Hosting" },
	{ id: "c-content", name: "Content & Copywriting" },
];
