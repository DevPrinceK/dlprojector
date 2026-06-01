use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Hymn {
    pub id: i64,
    pub number: String,
    pub title: String,
    pub category: Option<String>,
    pub author: Option<String>,
    pub lyrics_json: Value,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HymnInput {
    pub number: String,
    pub title: String,
    pub category: Option<String>,
    pub author: Option<String>,
    pub lyrics_json: Value,
    pub is_active: Option<bool>,
}
