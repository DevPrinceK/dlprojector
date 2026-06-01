fn main() {
    if let Err(error) = dlprojector_lib::run() {
        eprintln!("DL Projector failed to start safely: {error}");
    }
}
