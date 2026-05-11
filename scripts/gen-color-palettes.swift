#!/usr/bin/env swift
//
// Generate macOS Color Picker palettes (.clr) for piercemoore.com.
//
// Reads the site's CSS variable tokens (mirrored below; kept in sync
// with src/styles/globals.css) and writes two NSColorList files to
// ~/Library/Colors:
//
//   - "Piercemoore Dark.clr"
//   - "Piercemoore Light.clr"
//
// These appear as tabs in the macOS Color Picker (the floating panel
// in any Cocoa app -- Sketch, Figma desktop, Keynote, Notes, Mail,
// Preview annotation tools, etc.) under "Color Palettes".
//
// Run from the repo root:
//
//     swift scripts/gen-color-palettes.swift
//
// Re-run whenever the palette in globals.css changes -- the script
// overwrites the .clr files in place.
//

import AppKit
import Foundation

let outputDir = ("~/Library/Colors" as NSString).expandingTildeInPath
try? FileManager.default.createDirectory(
    atPath: outputDir, withIntermediateDirectories: true, attributes: nil
)

func rgb(_ r: Int, _ g: Int, _ b: Int, _ a: CGFloat = 1.0) -> NSColor {
    NSColor(
        srgbRed: CGFloat(r) / 255.0,
        green:   CGFloat(g) / 255.0,
        blue:    CGFloat(b) / 255.0,
        alpha:   a
    )
}

func hex(_ s: String) -> NSColor {
    let h = s.hasPrefix("#") ? String(s.dropFirst()) : s
    let r = Int(h.prefix(2), radix: 16)!
    let g = Int(h.dropFirst(2).prefix(2), radix: 16)!
    let b = Int(h.dropFirst(4).prefix(2), radix: 16)!
    return rgb(r, g, b)
}

struct Swatch { let name: String; let color: NSColor }

// Mirrors src/styles/globals.css :root and [data-theme='light'].
// Keep in sync by hand -- the CSS is the source of truth.
let palettes: [(String, [Swatch])] = [
    ("Piercemoore Dark", [
        Swatch(name: "bg",              color: hex("#0d0d10")),
        Swatch(name: "bg-elevated",     color: rgb(242, 237, 228, 0.012)),
        Swatch(name: "ink",             color: hex("#f2ede4")),
        Swatch(name: "ink-muted",       color: hex("#a8a095")),
        Swatch(name: "ink-dim",         color: hex("#8d877f")),
        Swatch(name: "ink-faint",       color: hex("#5a5a5a")),
        Swatch(name: "hairline",        color: rgb(242, 237, 228, 0.07)),
        Swatch(name: "accent",          color: hex("#ffb000")),
        Swatch(name: "accent-dim",      color: rgb(255, 176, 0, 0.28)),
        Swatch(name: "status-op",       color: hex("#4ade80")),
        Swatch(name: "status-maint",    color: hex("#ffb000")),
        Swatch(name: "status-archived", color: hex("#6b6b6b")),
    ]),
    ("Piercemoore Light", [
        Swatch(name: "bg",              color: hex("#f4f1ea")),
        Swatch(name: "bg-elevated",     color: rgb(13, 13, 16, 0.02)),
        Swatch(name: "ink",             color: hex("#1a1a1a")),
        Swatch(name: "ink-muted",       color: hex("#4a4a4a")),
        Swatch(name: "ink-dim",         color: hex("#5e5852")),
        Swatch(name: "ink-faint",       color: hex("#a0a0a0")),
        Swatch(name: "hairline",        color: rgb(13, 13, 16, 0.08)),
        Swatch(name: "accent",          color: hex("#8a5d0c")),
        Swatch(name: "accent-dim",      color: rgb(138, 93, 12, 0.32)),
        Swatch(name: "status-op",       color: hex("#16a34a")),
        Swatch(name: "status-maint",    color: hex("#8a5d0c")),
        Swatch(name: "status-archived", color: hex("#5e5852")),
    ]),
]

for (name, swatches) in palettes {
    let list = NSColorList(name: name)
    for s in swatches {
        list.setColor(s.color, forKey: s.name)
    }
    let path = "\(outputDir)/\(name).clr"
    let url = URL(fileURLWithPath: path)
    do {
        try list.write(to: url)
        print("wrote \(path)  (\(swatches.count) swatches)")
    } catch {
        print("failed to write \(name): \(error)")
        exit(1)
    }
}

print("")
print("Close and reopen any open Color Picker windows to pick up the new")
print("palettes -- they appear under 'Color Palettes' in the panel.")
