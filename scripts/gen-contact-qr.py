#!/usr/bin/env python3
"""
Regenerate public/contact-qr.png — a vCard QR code Pierce can offer
on the /resume-fallback/ page. Recruiter scans → Pierce becomes a
contact in their phone.

Run from the repo root:

    pip install 'qrcode[pil]'   # one-time
    python3 scripts/gen-contact-qr.py

The output is committed to the repo (it's tiny, ~5KB) so the build
doesn't need the python toolchain available. Re-run this script
manually when contact info changes.

Replace later with the qr-code-styling JS toolchain (option C in our
analytics design conversation) once Pierce hands over a config.
"""

from pathlib import Path

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask

REPO_ROOT = Path(__file__).resolve().parent.parent
LOGO_PATH = REPO_ROOT / "public" / "lambda-linus.png"
OUTPUT_PATH = REPO_ROOT / "public" / "contact-qr.png"

VCARD = "\r\n".join([
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Moore;Pierce",
    "FN:Pierce Moore",
    "TITLE:Senior DevOps Engineer",
    "ORG:piercemoore.com",
    "EMAIL;TYPE=INTERNET,PREF:hello@piercemoore.com",
    "TEL;TYPE=CELL:+1-469-554-0035",
    "URL:https://piercemoore.com",
    "URL;TYPE=linkedin:https://linkedin.com/in/piercemoore",
    "URL;TYPE=github:https://github.com/rex",
    "ADR;TYPE=WORK:;;;Addison;TX;;USA",
    "END:VCARD",
    "",
])


def main() -> None:
    qr = qrcode.QRCode(
        version=None,                                    # auto-fit
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # high redundancy → logo overlay safe
        box_size=12,
        border=4,
    )
    qr.add_data(VCARD)
    qr.make(fit=True)

    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(radius_ratio=1),
        color_mask=SolidFillColorMask(
            front_color=(13, 13, 16),     # site --bg dark = warm near-black
            back_color=(244, 241, 234),   # site --bg light = warm cream
        ),
        embeded_image_path=str(LOGO_PATH) if LOGO_PATH.exists() else None,
    )
    img.save(OUTPUT_PATH)
    size = OUTPUT_PATH.stat().st_size
    print(f"wrote {OUTPUT_PATH.relative_to(REPO_ROOT)} ({size:,} bytes)")


if __name__ == "__main__":
    main()
