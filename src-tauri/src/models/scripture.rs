use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BibleVersion {
    pub id: i64,
    pub name: String,
    pub abbreviation: String,
    pub language: String,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BibleVerse {
    pub id: i64,
    pub version_id: i64,
    pub book_id: i64,
    pub book_name: String,
    pub chapter: i64,
    pub verse: i64,
    pub text: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptureSearchResult {
    pub reference: String,
    pub version: String,
    pub verses: Vec<BibleVerse>,
}

#[derive(Debug, Clone)]
pub struct ScriptureReference {
    pub book: String,
    pub chapter: i64,
    pub verse_start: Option<i64>,
    pub verse_end: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptureImportResult {
    pub version: String,
    pub books_imported: i64,
    pub verses_imported: i64,
    pub verses_total: i64,
}
