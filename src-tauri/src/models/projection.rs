use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectionContent {
    #[serde(rename = "type")]
    pub content_type: String,
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub body: Option<String>,
    pub reference: Option<String>,
    pub image_path: Option<String>,
    pub metadata: Option<Value>,
}
