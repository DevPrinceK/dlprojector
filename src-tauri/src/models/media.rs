use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaAsset {
    pub id: i64,
    pub file_name: String,
    pub file_path: String,
    pub file_type: String,
    pub file_size: i64,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}
