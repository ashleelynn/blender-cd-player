"""Build album_sleeve.blend and album_sleeve.glb: a vinyl-style album sleeve at CD size.

Run from the project root:
    Blender -b --factory-startup --python scripts/build_album_sleeve.py
    Blender -b --factory-startup --python scripts/build_album_sleeve.py -- --preview

One sleeve is the template for every album. In three.js, clone it per album and put the
album art on `Cover` (and `Disc_Label`). Parts, in meters (Blender Z-up; the GLB is Y-up):

    AlbumSleeve      empty, the root
      Sleeve         card jacket, 130 x 130 x 3 mm, open along the top edge
      Cover          front art, UVs fill 0-1, slight ring wear where the disc presses
      Back_Cover     back art, UVs fill 0-1 (reads correctly from behind)
      Disc           120 mm CD inside the sleeve; slides up (+Y in three.js) out of the top
        Disc_Label   printed side of the disc, UVs map the art square across the disc

`--preview` also renders renders/album_sleeve_preview.png with the disc pulled half out.
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "textures", "cd_art.png")
PLAYER = os.path.join(ROOT, "cd_player.blend")
OUT_BLEND = os.path.join(ROOT, "album_sleeve.blend")
OUT_GLB = os.path.join(ROOT, "album_sleeve.glb")
OUT_PREVIEW = os.path.join(ROOT, "renders", "album_sleeve_preview.png")
PREVIEW = "--preview" in sys.argv

# ---------------------------------------------------------------- sizes (meters)
W = H = 0.130        # sleeve width and height
T = 0.003            # sleeve thickness
R = 0.0018           # corner radius
PANEL = 0.0005       # front / back card thickness
SIDE = 0.0018        # glued side and bottom seams
BEVEL = 0.00025
ART_GAP = 0.00008    # art sits just proud of the card
RING_H = 0.00022     # ring wear bulge
DISC_R, DISC_HOLE, DISC_T = 0.060, 0.0075, 0.0012
PEEK, OUT = 0.05, 0.13   # disc travel: peeking out / fully out

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
col = sc.collection


# ---------------------------------------------------------------- helpers
def link(name, me, parent=None):
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    o.parent = parent
    return o


def smooth(me, angle=30):
    me.shade_smooth()
    me.set_sharp_from_angle(angle=math.radians(angle))


def principled(name, base, rough, metal=0.0, coat=0.0, coat_rough=0.2, image=None):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except AttributeError:
        pass
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*base, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = coat_rough
    if image:
        tex = m.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = image
        tex.location = (-400, 200)
        m.node_tree.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    return m


def rounded_square(half, r, seg=8):
    """Outline in the XZ plane, counter-clockwise seen from the front (-Y)."""
    pts = []
    for cx, cz, a0 in ((half - r, -(half - r), -90), (half - r, half - r, 0),
                       (-(half - r), half - r, 90), (-(half - r), -(half - r), 180)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return pts


def smoothstep(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def art_panel(name, y, facing, mat, parent, n=72):
    """Rounded-square art panel with 0-1 UVs and a soft ring-wear bulge.

    facing = -1 for the front (normal -Y), +1 for the back (normal +Y).
    """
    half = W / 2 - BEVEL
    r = R - BEVEL
    a = half - r
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    grid = []
    for j in range(n + 1):
        row = []
        for i in range(n + 1):
            u, v = i / n, j / n
            x, z = (u - 0.5) * 2 * half, (v - 0.5) * 2 * half
            # pull the square's corners onto the rounded corners
            cx, cz = max(min(x, a), -a), max(min(z, a), -a)
            dx, dz = x - cx, z - cz
            d = math.hypot(dx, dz)
            if d > r:
                x, z = cx + dx * r / d, cz + dz * r / d
            bulge = RING_H * (1 - smoothstep(DISC_R - 0.006, DISC_R + 0.0008, math.hypot(x, z)))
            vert = bm.verts.new((x, y + facing * bulge, z))
            row.append((vert, (u if facing < 0 else 1 - u, v)))
        grid.append(row)
    for j in range(n):
        for i in range(n):
            quad = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]]
            if facing > 0:
                quad.reverse()
            f = bm.faces.new([q[0] for q in quad])
            for loop, (_, co) in zip(f.loops, quad):
                loop[uv].uv = co
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    me.shade_smooth()
    return link(name, me, parent)


# ---------------------------------------------------------------- materials
art = bpy.data.images.load(ART, check_existing=True)
MAT_CARD = principled("MAT_Sleeve_Card", (0.93, 0.92, 0.89), 0.78)
MAT_COVER = principled("MAT_Cover", (1, 1, 1), 0.42, coat=0.25, coat_rough=0.25, image=art)
MAT_BACK = principled("MAT_Back_Cover", (0.95, 0.95, 0.93), 0.6, coat=0.15)
MAT_PRINT = principled("MAT_Disc_Print", (1, 1, 1), 0.35, coat=0.3, coat_rough=0.15, image=art)

# the disc materials come from the player so a sleeve's disc matches the one in the deck
with bpy.data.libraries.load(PLAYER, link=False) as (src, dst):
    dst.materials = [m for m in ("MAT_Disc", "MAT_DiscHub") if m in src.materials]
MAT_DISC = bpy.data.materials.get("MAT_Disc") or principled("MAT_Disc", (0.9, 0.9, 0.92), 0.08, metal=1.0)
MAT_HUB = bpy.data.materials.get("MAT_DiscHub") or principled("MAT_DiscHub", (0.92, 0.95, 0.96), 0.05)

# ---------------------------------------------------------------- root
root = bpy.data.objects.new("AlbumSleeve", None)
root.empty_display_type = "PLAIN_AXES"
root.empty_display_size = 0.02
col.objects.link(root)
root["template"] = "album_sleeve"
root["size_m"] = W

# ---------------------------------------------------------------- jacket
bm = bmesh.new()
outline = rounded_square(W / 2, R)
front = [bm.verts.new((x, -T / 2, z)) for x, z in outline]
back = [bm.verts.new((x, T / 2, z)) for x, z in outline]
bm.faces.new(front)
bm.faces.new(list(reversed(back)))
for i in range(len(outline)):
    j = (i + 1) % len(outline)
    bm.faces.new((front[j], front[i], back[i], back[j]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new("Sleeve")
bm.to_mesh(me)
bm.free()
sleeve = link("Sleeve", me, root)

# cavity: open through the top edge, closed on the sides and bottom
cav_bottom, cav_top = -H / 2 + SIDE, H / 2 + 0.01
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
bmesh.ops.scale(bm, vec=(W - 2 * SIDE, T - 2 * PANEL, cav_top - cav_bottom), verts=bm.verts)
bmesh.ops.translate(bm, vec=(0, 0, (cav_top + cav_bottom) / 2), verts=bm.verts)
cme = bpy.data.meshes.new("Cavity")
bm.to_mesh(cme)
bm.free()
cutter = link("Cavity", cme)
mod = sleeve.modifiers.new("Cavity", "BOOLEAN")
mod.operation = "DIFFERENCE"
mod.solver = "EXACT"
mod.object = cutter
dg = bpy.context.evaluated_depsgraph_get()
baked = bpy.data.meshes.new_from_object(sleeve.evaluated_get(dg))
sleeve.modifiers.remove(mod)
old = sleeve.data
sleeve.data = baked
bpy.data.meshes.remove(old)
baked.name = "Sleeve"
bpy.data.objects.remove(cutter)
bpy.data.meshes.remove(cme)
sleeve.data.materials.clear()
sleeve.data.materials.append(MAT_CARD)
for p in sleeve.data.polygons:
    p.material_index = 0
bev = sleeve.modifiers.new("Bevel", "BEVEL")
bev.width = BEVEL
bev.segments = 2
bev.limit_method = "ANGLE"
bev.angle_limit = math.radians(30)
bev.harden_normals = True
smooth(sleeve.data)
sleeve["part"] = "jacket"
sleeve["opening"] = "top"

# ---------------------------------------------------------------- art
cover = art_panel("Cover", -T / 2 - ART_GAP, -1, MAT_COVER, root)
cover["texture"] = "cover_art"
back_cover = art_panel("Back_Cover", T / 2 + ART_GAP, 1, MAT_BACK, root)
back_cover["texture"] = "back_art"

# ---------------------------------------------------------------- disc
SEG = 128
radii = [DISC_HOLE, 0.0165, DISC_R - 0.0005, DISC_R]
bm = bmesh.new()


def ring(r, y):
    return [bm.verts.new((r * math.cos(2 * math.pi * k / SEG), y, r * math.sin(2 * math.pi * k / SEG)))
            for k in range(SEG)]


fr = [ring(r, -DISC_T / 2) for r in radii]
bk = [ring(r, DISC_T / 2) for r in radii]
faces_hub = []
for rings, flip in ((fr, False), (bk, True)):
    for a in range(len(radii) - 1):
        for k in range(SEG):
            q = (rings[a][k], rings[a][(k + 1) % SEG], rings[a + 1][(k + 1) % SEG], rings[a + 1][k])
            f = bm.faces.new(tuple(reversed(q)) if flip else q)
            if a == 0:
                faces_hub.append(f)
for idx in (0, len(radii) - 1):          # inner and outer walls
    for k in range(SEG):
        q = (fr[idx][k], fr[idx][(k + 1) % SEG], bk[idx][(k + 1) % SEG], bk[idx][k])
        f = bm.faces.new(q)
        if idx == 0:
            faces_hub.append(f)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
for f in faces_hub:
    f.material_index = 1
dme = bpy.data.meshes.new("Disc")
bm.to_mesh(dme)
bm.free()
dme.materials.append(MAT_DISC)
dme.materials.append(MAT_HUB)
smooth(dme, 40)
disc = link("Disc", dme, root)
disc["action"] = "slide_out"
disc["slide_axis"] = "+Y"            # three.js axis; Blender +Z
disc["peek_distance"] = PEEK
disc["out_distance"] = OUT

# printed side of the disc, facing the front like the cover
bm = bmesh.new()
uv = bm.loops.layers.uv.new("UVMap")
r_in, r_out, y = 0.0225, DISC_R - 0.0015, -DISC_T / 2 - 0.00005
inner = [bm.verts.new((r_in * math.cos(2 * math.pi * k / SEG), y, r_in * math.sin(2 * math.pi * k / SEG))) for k in range(SEG)]
outer = [bm.verts.new((r_out * math.cos(2 * math.pi * k / SEG), y, r_out * math.sin(2 * math.pi * k / SEG))) for k in range(SEG)]
for k in range(SEG):
    n = (k + 1) % SEG
    f = bm.faces.new((inner[k], inner[n], outer[n], outer[k]))
    for loop in f.loops:
        co = loop.vert.co
        loop[uv].uv = (co.x / (2 * DISC_R) + 0.5, co.z / (2 * DISC_R) + 0.5)
bm.normal_update()
for f in bm.faces:
    if f.normal.y > 0:
        f.normal_flip()
lme = bpy.data.meshes.new("Disc_Label")
bm.to_mesh(lme)
bm.free()
lme.materials.append(MAT_PRINT)
lme.shade_smooth()
label = link("Disc_Label", lme, disc)
label["texture"] = "cover_art"

# ---------------------------------------------------------------- preview scene (not exported)
sc.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    sc.cycles.device = "GPU"
except Exception:
    pass
sc.cycles.samples = 96
sc.cycles.use_denoising = True
sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = 1200
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Punchy"

world = bpy.data.worlds.new("Studio_World")
sc.world = world
try:
    world.use_nodes = True
except AttributeError:
    pass
wn = world.node_tree.nodes
bg = wn.get("Background") or wn.new("ShaderNodeBackground")
out = wn.get("World Output") or wn.new("ShaderNodeOutputWorld")
world.node_tree.links.new(bg.outputs["Background"], out.inputs["Surface"])
env = wn.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(os.path.join(bpy.utils.system_resource("DATAFILES", path="studiolights/world"), "studio.exr"))
world.node_tree.links.new(env.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 0.9

key = bpy.data.lights.new("Key", "AREA")
key.energy = 6.0
key.size = 0.35
ko = bpy.data.objects.new("Key", key)
col.objects.link(ko)
ko.location = (-0.25, -0.35, 0.35)
ko.rotation_euler = (Vector((0, 0, 0)) - ko.location).to_track_quat("-Z", "Y").to_euler()

aim = bpy.data.objects.new("Camera_Aim", None)
col.objects.link(aim)
aim.location = (0, 0, 0.022)
cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
col.objects.link(cam)
cam.data.lens = 85
cam.location = (-0.256, -0.468, 0.156)
track = cam.constraints.new("TRACK_TO")
track.target = aim
sc.camera = cam

# ---------------------------------------------------------------- save, preview, export
for o in (root, sleeve, cover, back_cover, disc, label):
    o.select_set(False)

if PREVIEW:
    disc.location.z = PEEK
    sc.render.filepath = OUT_PREVIEW
    bpy.ops.render.render(write_still=True)
    disc.location.z = 0.0

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND, relative_remap=True, compress=True)

for o in (root, sleeve, cover, back_cover, disc, label):
    o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=True,
    export_extras=True,
    export_apply=True,
    export_yup=True,
    export_image_format="JPEG",
)
print("SAVED", OUT_BLEND, OUT_GLB, "preview" if PREVIEW else "")
