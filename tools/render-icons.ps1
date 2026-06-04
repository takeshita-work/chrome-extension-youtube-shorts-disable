# Rasterize the master SVG to PNG icons using headless Chrome + ImageMagick.
#   icon.svg  = COLOR master (enabled).  Disabled icons = desaturated copy.
# Usage:
#   .\render-icons.ps1            -> writes icon{16,48,128}.png + icon_off{...}.png
#   .\render-icons.ps1 -Preview   -> also writes 256px previews into this folder
param([switch]$Preview)

$ErrorActionPreference = 'Stop'
$here   = $PSScriptRoot
$outDir = Join-Path $here "..\src\icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Locate Chrome / Edge.
$chrome = $null
foreach ($p in @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)) { if (Test-Path $p) { $chrome = $p; break } }
if (-not $chrome) { throw "Chrome/Edge not found" }

# Locate ImageMagick (for trim / desaturate / center / resize).
$magick = (Get-Command magick -ErrorAction SilentlyContinue).Source
if (-not $magick) { throw "ImageMagick (magick) not found" }

# Fraction of the canvas the glyph fills after centering (rest is padding).
$fill      = 0.92
$masterSvg = Join-Path $here 'icon.svg'
$sizes     = @(16, 48, 128)
if ($Preview) { $sizes = @(16, 48, 128, 256) }

# Color sets injected into the SVG via CSS variables.
$colorVars = ':root{--logo:#FF0000;--casing:#FFFFFF;--slash:#202020}'  # enabled
$grayVars  = ':root{--logo:#9E9E9E;--casing:#FFFFFF;--slash:#5E5E5E}'  # disabled

# Render the master SVG once at 512px with the given CSS vars; return temp PNG path.
function Render-Master($vars) {
  $svg = Get-Content -Raw -Encoding UTF8 $masterSvg
  $html = @"
<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;overflow:hidden;background:transparent}
svg{display:block;width:100vw;height:100vh}
$vars
</style></head><body>$svg</body></html>
"@
  $id      = [System.Guid]::NewGuid().ToString("N")
  $tmpHtml = Join-Path $env:TEMP ("ysd_" + $id + ".html")
  $tmpPng  = Join-Path $env:TEMP ("ysd_" + $id + ".png")
  $tmpProf = Join-Path $env:TEMP ("ysd_prof_" + $id)
  Set-Content -Path $tmpHtml -Value $html -Encoding UTF8
  $args = @(
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    "--user-data-dir=$tmpProf",
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    '--virtual-time-budget=2000',
    '--window-size=512,512',
    "--screenshot=$tmpPng",
    $tmpHtml
  )
  # Chrome logs to stderr; don't let that abort the script.
  $old = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & $chrome @args | Out-Null
  $ErrorActionPreference = $old
  if (-not (Test-Path $tmpPng)) { throw "render failed" }
  Remove-Item $tmpHtml -Force -ErrorAction SilentlyContinue
  Remove-Item $tmpProf -Recurse -Force -ErrorAction SilentlyContinue
  return $tmpPng
}

# From a 512 master PNG, write one sized PNG (trim / center / pad).
function Write-Sized($masterPng, $outPng, $size) {
  $inner = [int]([math]::Round($size * $fill))
  & $magick $masterPng -trim +repage -background none `
    -resize "${inner}x${inner}" -gravity center -extent "${size}x${size}" $outPng
  if (-not (Test-Path $outPng)) { throw "magick failed: $outPng" }
}

$masterColor = Render-Master $colorVars
$masterGray  = Render-Master $grayVars
try {
  foreach ($sz in $sizes) {
    if ($sz -eq 256) {
      $pc = Join-Path $here "preview_icon.png"
      $pg = Join-Path $here "preview_icon_off.png"
      Write-Sized $masterColor $pc 256
      Write-Sized $masterGray  $pg 256
      Write-Output "preview: $pc (color), $pg (gray)"
    } else {
      $oc = Join-Path $outDir ("icon" + $sz + ".png")          # enabled  = color
      $og = Join-Path $outDir ("icon_off" + $sz + ".png")      # disabled = gray
      Write-Sized $masterColor $oc $sz
      Write-Sized $masterGray  $og $sz
      Write-Output "icon: $oc + $og"
    }
  }
} finally {
  Remove-Item $masterColor, $masterGray -Force -ErrorAction SilentlyContinue
}
