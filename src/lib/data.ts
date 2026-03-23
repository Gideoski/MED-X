import type { LucideIcon } from "lucide-react";
import { BookCopy, FileText, Presentation, Laptop, Scroll, Mic, PenTool, Lightbulb, FolderKanban, Users, BrainCircuit } from "lucide-react";
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
    icon: BrainCircuit,
    title: "AI Practice Quizzes",
    description: "Generate high-yield, multiple-choice practice questions instantly from any study topic. Test your knowledge with MED-X AI.",
    idealFor: "Active recall and exam preparation.",
    deliverables: "Interactive real-time quizzes.",
    addOns: "Detailed model answers."
  },
  {
    category: "Academic Services",
    icon: BookCopy,
    title: "Topic Summaries & Reviews",
    description: "Concise, exam-focused writeups of single lecture topics. Includes short explanations, key diagrams/tables, and Exam Focus Points.",
    idealFor: "Quick revision, week-before cramming.",
    deliverables: "PDF (print + mobile friendly).",
    addOns: "Key past questions; mini glossary."
  },
  {
    category: "Academic Services",
    icon: FileText,
    title: "Topic Q&A E-books",
    description: "A curated set of 20–50 practice questions per topic (MCQs, SAQs, and long answers) with model answers.",
    idealFor: "Exam practice and self-testing.",
    deliverables: "PDF (print + mobile friendly).",
    addOns: "Marking scheme notes."
  },
  {
    category: "Academic Services",
    icon: Scroll,
    title: "Course-Wide Revision Packs",
    description: "Comprehensive revision books covering all major topics in a course, with flowcharts and mind maps.",
    idealFor: "End-of-semester revision.",
    addOns: "PowerPoint version of each chapter."
  },
  {
    category: "Academic Services",
    icon: Presentation,
    title: "PowerPoint Slide Design",
    description: "We convert your raw notes into clean, readable and attractive slides for class presentations.",
    idealFor: "Seminar presenters and group project leaders.",
    deliverables: "Customized PowerPoint.",
    addOns: "Presenter notes, school logo branding."
  },
  {
    category: "Academic Services",
    icon: Laptop,
    title: "Project Assistance",
    description: "Help structuring and polishing long-form academic projects. We handle referencing, editing, and final formatting.",
    idealFor: "Final-year and project students.",
    deliverables: "Polished project document.",
    addOns: "PowerPoint version; short plagiarism-check summary."
  },
  {
    category: "Creative & Non-Academic Services",
    icon: PenTool,
    title: "Creative Writing Design",
    description: "Turn poems, essays or short stories into a stylized e-book with a cover and polished layout.",
    idealFor: "Student writers & club publications.",
    deliverables: "E-book (PDF/EPUB).",
    addOns: "Social-share graphics."
  },
  {
    category: "Creative & Non-Academic Services",
    icon: Mic,
    title: "Personal Notes → E-Book Conversion",
    description: "Send your typed or handwritten notes; we type, organize, format and beautify them into a clean e-book.",
    idealFor: "Students who want tidy, searchable study notes.",
    deliverables: "Organized E-book (PDF).",
    addOns: "Color-coded versions."
  },
  {
    category: "Creative & Non-Academic Services",
    icon: Lightbulb,
    title: "Mini Study Guides",
    description: "3–5 page focused summaries: mnemonics, formulas, and comparison tables for last-minute revision.",
    idealFor: "Last-minute exam prep.",
    deliverables: "Short E-book (PDF).",
    addOns: "QR links to short videos."
  },
  {
    category: "Creative & Non-Academic Services",
    icon: FolderKanban,
    title: "E-Book Presentation Templates",
    description: "Ready-to-edit PPT or PDF templates for research defenses and medical case presentations.",
    idealFor: "Frequent presenters.",
    deliverables: "Editable template files.",
    addOns: "Color-theme customization."
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
        avatar: "/images/Tyrese.jpeg",
        imageHint: "man portrait",
        bio: "A med-student turned study-designer, Denzel founded MED-X with the goal of helping students study smarter, not harder. His focus is on creating clear, concise, and beautifully formatted study materials."
    },
    {
        id: "c2",
        name: "Ekemini-Abasi",
        title: "Publicity lead and HR manager.",
        avatar: "/images/ekems.jpeg",
        imageHint: "man portrait",
        bio: "A medical student who doubles as the engine room behind Med X’s visibility and people management. He shapes the brand’s voice, amplifies its reach, and builds a driven team."
    },
    {
        id: "c3",
        name: "Ben Eze",
        title: "Creative Director",
        avatar: "https://images.unsplash.com/photo-1684853884851-00f0d8667f58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8bWFuJTIwZ2xhc3Nlc3xlbnwwfHx8fDE3NzEzOTU3OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
        imageHint: "man glasses",
        bio: "Ben is the creative force behind MED-X's visual identity. He specializes in turning complex information into beautiful, engaging e-books."
    }
]
