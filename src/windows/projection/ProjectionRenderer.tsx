import type { ProjectionContent } from "../../types/projection";
import { AnnouncementSlide } from "./slides/AnnouncementSlide";
import { BlankSlide } from "./slides/BlankSlide";
import { HymnSlide } from "./slides/HymnSlide";
import { LoaderSlide } from "./slides/LoaderSlide";
import { LogoSlide } from "./slides/LogoSlide";
import { PersonalitySlide } from "./slides/PersonalitySlide";
import { ScriptureSlide } from "./slides/ScriptureSlide";

interface ProjectionRendererProps {
  content: ProjectionContent;
  preview?: boolean;
}

export function ProjectionRenderer({ content, preview = false }: ProjectionRendererProps) {
  switch (content.type) {
    case "scripture":
      return <ScriptureSlide content={content} preview={preview} />;
    case "hymn":
      return <HymnSlide content={content} preview={preview} />;
    case "announcement":
      return <AnnouncementSlide content={content} preview={preview} />;
    case "personality":
      return <PersonalitySlide content={content} preview={preview} />;
    case "blank":
      return <BlankSlide />;
    case "loader":
      return <LoaderSlide subtitle={content.subtitle} preview={preview} />;
    case "custom":
      return <HymnSlide content={content} preview={preview} />;
    case "logo":
    default:
      return <LogoSlide content={content} preview={preview} />;
  }
}
