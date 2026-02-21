import type { LucideIcon } from "lucide-react";
import { BookCopy, FileText, Presentation, Laptop, Scroll, Mic, PenTool, Lightbulb, FolderKanban, Users } from "lucide-react";
import { PlaceHolderImages } from "./placeholder-images";

export interface Service {
  title: string;
  category: "Academic Services" | "Creative & Non-Academic Services";
  icon: LucideIcon;
  description: string;
  idealFor: string;
  deliverables?: string;
  addOns?: string;
}

export const services: Service[] = [
  {
    category: "Academic Services",
    icon: BookCopy,
    title: "Topic Summaries & Reviews",
    description: "Concise, exam-focused writeups of single lecture topics. Includes short explanations, key diagrams/tables, highlighted Exam Focus Points, and a one-page recap.",
    idealFor: "Quick revision, week-before cramming.",
    deliverables: "PDF (print + mobile friendly); optional DOCX on request.",
    addOns: "Key past questions; mini glossary."
  },
  {
    category: "Academic Services",
    icon: FileText,
    title: "Topic Q&A E-books",
    description: "A curated set of 20–50 practice questions per topic (MCQs, SAQs, and long answers) with full, step-by-step model answers and examiner tips.",
    idealFor: "Exam practice and self-testing.",
    addOns: "Marking scheme notes."
  },
  {
    category: "Academic Services",
    icon: Scroll,
    title: "Course-Wide Revision Packs",
    description: "Comprehensive revision books covering all major topics in a course, with flowcharts, mind maps, and chapter practice questions.",
    idealFor: "End-of-semester revision.",
    addOns: "PowerPoint version of each chapter for class revision."
  },
  {
    category: "Academic Services",
    icon: Presentation,
    title: "PowerPoint Slide Design",
    description: "We convert your raw notes into clean, readable and attractive slides for class presentations or seminars.",
    idealFor: "Seminar presenters and group project leaders.",
    addOns: "Presenter notes, animated transitions, school logo branding."
  },
  {
    category: "Academic Services",
    icon: Laptop,
    title: "Project Assistance",
    description: "Help structuring and polishing long-form academic projects — from Abstract to Conclusion. We do paraphrasing, referencing, editing, and final formatting.",
    idealFor: "Final-year and project students.",
    addOns: "PowerPoint version; short plagiarism-check summary."
  },
  {
    category: "Creative & Non-Academic Services",
    icon: PenTool,
    title: "Creative Writing Design",
    description: "Turn poems, essays or short stories into a stylized e-book with a cover, headers and polished layout — ready for sharing or publishing.",
    idealFor: "Student writers & club publications.",
    addOns: "Free e-publishing guidance and social-share graphics."
  },
  {
    category: "Creative & Non-Academic Services",
    icon: Mic,
    title: "Personal Notes → E-Book Conversion",
    description: "Send your typed or handwritten notes; we type, organize, format and beautify them into a clean e-book.",
    idealFor: "Students who want tidy, searchable study notes.",
    addOns: "AI-generated quizzes and color-coded versions."
  },
  {
    category: "Creative & Non-Academic Services",
    icon: Lightbulb,
    title: "Mini Study Guides (“Crash Course” Series)",
    description: "3–5 page focused summaries that cover a single topic quickly: mnemonics, formulas, comparison tables and a “3-Minute Read” for last-minute revision.",
    idealFor: "Last-minute exam prep.",
    addOns: "Bundle 5 topics; QR links to short videos."
  },
  {
    category: "Creative & Non-Academic Services",
    icon: FolderKanban,
    title: "E-Book Presentation Templates",
    description: "Ready-to-edit PPT or PDF templates for research defenses, medical case presentations and class talks.",
    idealFor: "Frequent presenters.",
    addOns: "Color-theme customization and matching poster design."
  },
  {
    category: "Creative & Non-Academic Services",
    icon: Users,
    title: "E-Book Portfolios for Clubs & Orgs",
    description: "Beautifully formatted club booklets with mission, event highlights, member profiles and photos.",
    idealFor: "Student societies and campus clubs."
  }
];

export interface EBook {
  id: string;
  title: string;
  description: string;
  author: string;
  level: 100 | 200;
  isPremium: boolean;
  coverImage: string;
  imageHint: string;
  filePath: string;
}

export interface Creator {
    id: string;
    name: string;
    title: string;
    avatar: string;
    bio: string;
    imageHint: string;
}

export const creators: Creator[] = [
    {
        id: "c1",
        name: "Denzel",
        title: "Founder & Study Designer",
        avatar: PlaceHolderImages.find(p => p.id === 'avatar-denzel')!.imageUrl,
        imageHint: "man portrait",
        bio: "A med-student turned study-designer, Denzel founded MED-X with the goal of helping students study smarter, not harder. His focus is on creating clear, concise, and beautifully formatted study materials."
    },
    {
        id: "c2",
        name: "Dr. Ada Okoro",
        title: "Anatomy Content Lead",
        avatar: PlaceHolderImages.find(p => p.id === 'avatar-ada')!.imageUrl,
        imageHint: "woman portrait",
        bio: "With over 10 years of experience teaching anatomy, Dr. Okoro ensures all anatomical content is accurate, easy to understand, and aligned with current medical school curriculums."
    },
    {
        id: "c3",
        name: "Ben Eze",
        title: "Creative Director",
        avatar: PlaceHolderImages.find(p => p.id === 'avatar-ben')!.imageUrl,
        imageHint: "man glasses",
        bio: "Ben is the creative force behind MED-X's visual identity. He specializes in turning complex information into beautiful, engaging e-books and presentation slides."
    }
]
