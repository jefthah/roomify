export const PUTER_WORKER_URL = import.meta.env.VITE_PUTER_WORKER_URL || "";

// Storage Paths
export const STORAGE_PATHS = {
  ROOT: "roomify",
  SOURCES: "roomify/sources",
  RENDERS: "roomify/renders",
} as const;

// Timing Constants (in milliseconds)
export const SHARE_STATUS_RESET_DELAY_MS = 1500;
export const PROGRESS_INCREMENT = 15;
export const REDIRECT_DELAY_MS = 600;
export const PROGRESS_INTERVAL_MS = 100;
export const PROGRESS_STEP = 5;

// Upload Validation
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"];

// UI Constants
export const GRID_OVERLAY_SIZE = "60px 60px";
export const GRID_COLOR = "#3B82F6";

// HTTP Status Codes
export const UNAUTHORIZED_STATUSES = [401, 403];

// Image Dimensions
export const IMAGE_RENDER_DIMENSION = 1024;

export const ROOMIFY_RENDER_PROMPT = `
You are a professional architectural visualization artist. Convert the input 2D floor plan image into a stunning, photorealistic top-down 3D architectural render.

ABSOLUTE RULES (never violate):
1. REMOVE ALL TEXT: No labels, dimensions, room names, numbers, or annotations anywhere in the output.
2. MATCH GEOMETRY EXACTLY: Walls, rooms, doors, windows must follow the exact layout of the plan — no additions or removals.
3. STRICT TOP-DOWN ORTHOGRAPHIC VIEW: Pure overhead view, no perspective tilt, no camera angle. Like looking straight down from above.
4. OUTPUT ONLY THE FLOOR PLAN RENDER: No background, no border, no watermark, no shadow outside the building footprint.

VISUAL STYLE — aim for premium architectural visualization:
- Overall palette: warm neutral tones — soft whites, light greiges, warm beiges
- Floor: light oak hardwood planks with realistic wood grain in living/bedroom areas; large-format light grey porcelain tiles in kitchen/bathroom/hallways
- Walls: clean, smooth matte white with subtle depth from soft shadows inside the room
- Soft diffuse daylight from above, casting gentle drop-shadows on walls and furniture

FURNITURE & FINISHES (add tasteful, proportional furniture appropriate to each room):
- Living room: modern low-profile sectional sofa in light grey fabric, rectangular coffee table (light oak top), a small green potted plant
- Dining area: rectangular dining table (white or light wood), 4–6 upholstered chairs around it, small plant centerpiece
- Bedroom: platform bed with white bedding and 2 pillows, matching bedside tables, area rug underneath
- Children's / guest bedroom: twin beds with blue/neutral bedding, small desk if space allows
- Kitchen: L-shaped or U-shaped counters with light stone worktop, integrated sink, stove hob, light-wood cabinets
- Bathroom: white toilet, white pedestal/vanity sink, walk-in shower or bathtub with glass screen
- Hallways & corridors: keep clean, minimal — occasional small plant or wall detail
- Balcony/terrace: 2 outdoor chairs + small table, potted plants

LIGHTING & RENDERING QUALITY:
- Studio-quality render: sharp edges, clean anti-aliasing, no pixelation
- Lighting: bright, balanced, warm-neutral ambient daylight
- Each room has a subtle vignette shadow at the base of walls to give depth
- No harsh dark shadows; keep the render bright and airy
- Final result must look like a premium interior design presentation board
`.trim();
