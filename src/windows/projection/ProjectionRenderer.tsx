import type { ProjectionContent } from "../../types/projection";
import { AnnouncementSlide } from "./slides/AnnouncementSlide";
import { BlankSlide } from "./slides/BlankSlide";
import { HymnSlide } from "./slides/HymnSlide";
import { LoaderSlide } from "./slides/LoaderSlide";
import { LogoSlide } from "./slides/LogoSlide";
import { PersonalitySlide } from "./slides/PersonalitySlide";
import { ScriptureSlide } from "./slides/ScriptureSlide";
import type { ProjectionPreferences } from "../../stores/settings.store";

interface ProjectionRendererProps {
  content: ProjectionContent;
  preview?: boolean;
  preferences?: ProjectionPreferences;
}

export function ProjectionRenderer({ content, preview = false, preferences }: ProjectionRendererProps) {
  switch (content.type) {
    case "scripture":
      return <ScriptureSlide content={content} preview={preview} showVersion={preferences?.showScriptureVersion} referencePosition={preferences?.scriptureReferencePosition} />;
    case "hymn":
      return <HymnSlide content={content} preview={preview} showTitle={preferences?.showHymnTitle} scrollSecondsPerLine={preferences?.hymnScrollSecondsPerLine} textAlign={preferences?.hymnTextAlign} />;
    case "announcement":
      return <AnnouncementSlide content={content} preview={preview} />;
    case "personality":
      return <PersonalitySlide content={content} preview={preview} />;
    case "blank":
      return <BlankSlide />;
    case "loader":
      return <LoaderSlide title={preferences?.loaderText ?? content.title} subtitle={content.subtitle} preview={preview} />;
    case "custom":
      return <HymnSlide content={content} preview={preview} showTitle={preferences?.showHymnTitle} scrollSecondsPerLine={preferences?.hymnScrollSecondsPerLine} textAlign={preferences?.hymnTextAlign} />;
    case "logo":
    default:
      return <LogoSlide content={content} preview={preview} />;
  }
}
