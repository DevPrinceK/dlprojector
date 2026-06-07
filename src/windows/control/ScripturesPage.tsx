import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { listBibleVersions, searchScriptures } from "../../features/scriptures/scripture.api";
import { scriptureResultToProjection } from "../../features/scriptures/scripture.utils";
import { toErrorMessage } from "../../lib/error-handling";
import { useAppStore } from "../../stores/app.store";
import { useProjectionStore } from "../../stores/projection.store";
import type { BibleVersion, ScriptureSearchResult } from "../../types/scripture";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "./components/PageHeader";
import { useSettingsStore } from "../../stores/settings.store";

export function ScripturesPage() {
  const defaultBibleVersion = useSettingsStore((state) => state.preferences.defaultBibleVersion);
  const pushToast = useAppStore((state) => state.pushToast);
  const setPreviewContent = useProjectionStore((state) => state.setPreviewContent);
  const projectContent = useProjectionStore((state) => state.projectContent);
  const [query, setQuery] = useState("John 3:16");
  const [results, setResults] = useState<ScriptureSearchResult[]>([]);
  const [selected, setSelected] = useState<ScriptureSearchResult | null>(null);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState(defaultBibleVersion);
  const [verseIndex, setVerseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingVersion, setIsSwitchingVersion] = useState(false);

  const runSearch = async (nextQuery = query) => {
    setIsLoading(true);
    try {
      const nextResults = await searchScriptures(nextQuery, selectedVersion);
      setResults(nextResults);
      const first = nextResults[0] ?? null;
      setSelected(first);
      setVerseIndex(0);
      if (first) setPreviewContent(scriptureResultToProjection(first, 0));
    } catch (error) {
      pushToast({ kind: "error", title: "Could not search scriptures", description: toErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void listBibleVersions().then((items) => {
      setVersions(items);
      const preferredVersion = items.find((item) => item.abbreviation === defaultBibleVersion)?.abbreviation;
      const fallbackVersion = items.find((item) => item.isDefault)?.abbreviation ?? items[0]?.abbreviation ?? "KJV";
      setSelectedVersion(preferredVersion ?? fallbackVersion);
    });
    void runSearch("John 3:16");
  }, []);

  useEffect(() => {
    if (query.trim()) void runSearch(query);
  }, [selectedVersion]);

  const selectResult = (result: ScriptureSearchResult, index = 0) => {
    setSelected(result);
    setVerseIndex(index);
    setPreviewContent(scriptureResultToProjection(result, index));
  };

  const moveVerse = (direction: -1 | 1) => {
    if (!selected) return;
    const nextIndex = Math.max(0, Math.min(verseIndex + direction, selected.verses.length - 1));
    selectResult(selected, nextIndex);
  };

  const projectSelected = async () => {
    if (!selected) return;
    await projectContent(scriptureResultToProjection(selected, verseIndex));
  };

  const switchPreviewVersion = async (version: string) => {
    if (!selected || version === selected.version) return;

    setIsSwitchingVersion(true);
    try {
      const matchingResults = await searchScriptures(selected.reference, version);
      const matchingPassage = matchingResults[0];
      if (!matchingPassage) {
        pushToast({
          kind: "error",
          title: `${version} passage unavailable`,
          description: `${selected.reference} was not found in the selected Bible version.`
        });
        return;
      }

      const currentVerse = selected.verses[verseIndex]?.verse;
      const matchingVerseIndex =
        currentVerse === undefined
          ? Math.min(verseIndex, matchingPassage.verses.length - 1)
          : matchingPassage.verses.findIndex((verse) => verse.verse === currentVerse);
      selectResult(matchingPassage, matchingVerseIndex >= 0 ? matchingVerseIndex : 0);
    } catch (error) {
      pushToast({
        kind: "error",
        title: "Could not change Bible version",
        description: toErrorMessage(error)
      });
    } finally {
      setIsSwitchingVersion(false);
    }
  };

  return (
    <section>
      <PageHeader
        eyebrow="Scripture Projection"
        title="Find a passage fast"
        description="Search references like John 3:16, Psalm 23, Romans 8:28, or Genesis 1:1-5. Results are projected one verse at a time for readability."
      />

      <form
        className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          void runSearch();
        }}
      >
        <Input
          data-search-input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search scripture..."
        />
        <select
          className="h-11 rounded-lg border border-input bg-white px-3 text-sm font-semibold text-navy-900"
          value={selectedVersion}
          onChange={(event) => setSelectedVersion(event.target.value)}
          aria-label="Bible version"
        >
          {versions.map((version) => (
            <option key={version.abbreviation} value={version.abbreviation}>
              {version.abbreviation}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={isLoading}>
          <Search className="h-4 w-4" />
          Search
        </Button>
      </form>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>{results.length} matching passage(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.length === 0 ? (
              <EmptyState title="No scripture found" description="Try a direct reference or import more Bible data in the desktop app." />
            ) : (
              results.map((result) => (
                <button
                  key={result.reference}
                  type="button"
                  onClick={() => selectResult(result)}
                  className="w-full rounded-xl border border-border bg-white/[0.72] p-4 text-left transition hover:border-gold-300 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black">{result.reference}</span>
                    <Badge>{result.version}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{result.verses[0]?.text}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="dl-glass">
          <CardHeader>
            <CardTitle>{selected?.reference ?? "Preview passage"}</CardTitle>
            <CardDescription>
              Verse {(selected ? verseIndex + 1 : 0).toString()} of {selected?.verses.length ?? 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div>
                <div className="rounded-xl bg-navy-900 p-8 text-white">
                  <div className="text-gold-100">{scriptureResultToProjection(selected, verseIndex).reference}</div>
                  <p className="mt-4 whitespace-pre-line text-3xl font-bold leading-snug">
                    {selected.verses[verseIndex]?.text}
                  </p>
                  <div className="mt-5 text-sm text-white/60">{selected.version}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => moveVerse(-1)} disabled={verseIndex <= 0}>
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button variant="outline" onClick={() => moveVerse(1)} disabled={verseIndex >= selected.verses.length - 1}>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <select
                    className="h-11 rounded-lg border border-input bg-white px-3 text-sm font-semibold text-navy-900 disabled:cursor-wait disabled:opacity-60"
                    value={selected.version}
                    onChange={(event) => void switchPreviewVersion(event.target.value)}
                    disabled={isSwitchingVersion}
                    aria-label="Quick projection Bible version"
                    title="Change the preview and projection Bible version"
                  >
                    {versions.map((version) => (
                      <option key={version.abbreviation} value={version.abbreviation}>
                        {version.abbreviation}
                      </option>
                    ))}
                  </select>
                  <Button variant="gold" onClick={() => void projectSelected()} disabled={isSwitchingVersion}>
                    {isSwitchingVersion ? "Changing Version..." : "Project Verse"}
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState title="Select a scripture" description="Choose a search result to preview and project." />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
