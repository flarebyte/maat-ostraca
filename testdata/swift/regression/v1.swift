import Foundation
import XCTest
import Testing

public protocol Reader: Sendable {
    func read(_ path: String) throws -> String
}

class Base {}
final class Cache: Base, Reader {
    init() { print("created") }
    deinit { print("disposed") }
    func read(_ path: String) throws -> String {
        let home = ProcessInfo.processInfo.environment["HOME"]
        if home == nil { fatalError("missing home") }
        return try String(contentsOfFile: path)
    }
}

extension Cache {
    static func build() -> Cache { Cache() }
}

func save(_ text: String, to path: String) throws {
    logger.error("saving data")
    try text.write(toFile: path, atomically: true, encoding: .utf8)
}

@Test("loads configuration")
func configuration() {
    let build = getenv("BUILD_ID")
    for value in [1, 2] { print(value) }
    #expect(build != nil)
}

final class CacheTests: XCTestCase {
    func testRead() { print("test") }
}
