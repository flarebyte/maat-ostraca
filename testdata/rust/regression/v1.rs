use std::{env as system, fs::{read_to_string as load, write}, io::Read};
use crate::helpers::prepare;

pub trait Reader: Send + Sync {
    fn read(&self) -> String;
    fn label(&self) -> &'static str { "reader" }
}

struct Cache<T> { value: T }

impl<T: Send + Sync> Reader for Cache<T> {
    fn read(&self) -> String {
        let path = system::var("HOME").unwrap_or_default();
        let text = load(path).unwrap_or_default();
        println!("loaded {}", text);
        text
    }
}

impl<T> Cache<T> {
    pub fn new(value: T) -> Self { Self { value } }
}

pub fn save(path: &str, data: &str) {
    prepare();
    if data.is_empty() {
        log::error!("empty data");
        panic!(r#"cannot save "empty" data"#);
    }
    write(path, data).unwrap();
}

#[test]
fn test_configuration() {
    let build = option_env!("BUILD_ID");
    for item in [1, 2] {
        if item > 0 { eprintln!("item {}", item); }
    }
    assert!(build.is_some());
}
