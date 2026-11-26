"""Build cd_player_play.blend: the CD player on a white studio floor, playing a chosen CD.

Run from the project root:
    Blender -b cd_player.blend --python scripts/build_play_animation.py

Reads cd_player.blend (unchanged) and textures/cd_art.png, writes cd_player_play.blend.
Timeline (24 fps, 240 frames = 10 s):
    4-16    OPEN slider nudges down and back
    10-34   lid swings open
    28-76   disc glides in from the right and seats on the spindle
    86-110  lid closes with a small settle
    118-126 PLAY key presses, CRT flickers on
    122-240 disc spins up and keeps playing; camera drifts in the whole time
"""
import math
import os

import bpy
from mathutils import Vector

ROOT = os.path.dirname(bpy.data.filepath)
OUT_BLEND = os.path.join(ROOT, "cd_player_play.blend")
ART = "//textures/cd_art.png"

FPS = 24
F_END = 240
DISC_REST = Vector((0.0, 0.022, 0.015))

sc = bpy.context.scene
obj = bpy.data.objects
rad = math.radians


# ---------------------------------------------------------------- helpers
def key(o, path, frame, value, index=-1, interp=None, easing=None, back=None):
    """Set a property and keyframe it; optionally set the interpolation of the new key."""
    if index >= 0:
        getattr(o, path)[index] = value
    else:
        setattr(o, path, value)
    o.keyframe_insert(data_path=path, index=index, frame=frame)
    if interp:
        fcurves = _fcurves(o)
        for fc in fcurves:
            if fc.data_path == path and (index < 0 or fc.array_index == index):
                for kp in fc.keyframe_points:
                    if abs(kp.co.x - frame) < 1e-3:
                        kp.interpolation = interp
                        if easing:
                            kp.easing = easing
                        if back is not None:
                            kp.back = back


def _fcurves(idblock):
    """F-curves of an ID's action (layered actions in Blender 4.4+/5.x)."""
    ad = idblock.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    if hasattr(act, "layers") and act.layers:
        out = []
        for layer in act.layers:
            for strip in layer.strips:
                bag = strip.channelbag(ad.action_slot) if ad.action_slot else None
                if bag:
                    out.extend(bag.fcurves)
        return out
    return list(act.fcurves)


def key_socket(node_tree_owner, socket, frame, value, interp=None):
    socket.default_value = value
    socket.keyframe_insert("default_value", frame=frame)
    if interp:
        for fc in _fcurves(node_tree_owner):
            for kp in fc.keyframe_points:
                if abs(kp.co.x - frame) < 1e-3:
                    kp.interpolation = interp


# ---------------------------------------------------------------- render setup
sc.render.fps = FPS
sc.frame_start = 1
sc.frame_end = F_END
sc.render.resolution_x = 1080
sc.render.resolution_y = 1440
sc.render.resolution_percentage = 100
sc.render.use_persistent_data = True
sc.render.use_motion_blur = True
sc.render.motion_blur_shutter = 0.5
sc.cycles.samples = 96
sc.cycles.use_adaptive_sampling = True
sc.cycles.adaptive_threshold = 0.02
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 12
sc.cycles.glossy_bounces = 6
sc.cycles.transmission_bounces = 10
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGB"
sc.render.image_settings.color_depth = "8"
sc.render.filepath = "//renders/play_frames/frame_"

# Neutral product-shot tone mapping: whites stay white, the hot pink keys keep their hue.
sc.view_settings.view_transform = "Khronos PBR Neutral"
sc.view_settings.look = "None"
sc.view_settings.exposure = 0.0

# ---------------------------------------------------------------- disc art
img = bpy.data.images.load(ART, check_existing=True)
img.colorspace_settings.name = "sRGB"

art = bpy.data.materials.new("MAT_DiscArt")
art.use_nodes = True
nt = art.node_tree
N, L = nt.nodes, nt.links
out = N["Material Output"]
printed = N["Principled BSDF"]
printed.name = "Print"
printed.inputs["Roughness"].default_value = 0.42
printed.inputs["Coat Weight"].default_value = 0.6
printed.inputs["Coat Roughness"].default_value = 0.06

tc = N.new("ShaderNodeTexCoord")
mp = N.new("ShaderNodeMapping")
mp.inputs["Location"].default_value = (0.5, 0.5, 0.0)
mp.inputs["Scale"].default_value = (1 / 0.12, 1 / 0.12, 1.0)
tex = N.new("ShaderNodeTexImage")
tex.image = img
tex.interpolation = "Cubic"
tex.extension = "EXTEND"
L.new(tc.outputs["Object"], mp.inputs["Vector"])
L.new(mp.outputs["Vector"], tex.inputs["Vector"])
L.new(tex.outputs["Color"], printed.inputs["Base Color"])

# radius in the disc's own XY plane -> thin mirror rings at the outer edge and around the hub
sep = N.new("ShaderNodeSeparateXYZ")
comb = N.new("ShaderNodeCombineXYZ")
length = N.new("ShaderNodeVectorMath")
length.operation = "LENGTH"
L.new(tc.outputs["Object"], sep.inputs[0])
L.new(sep.outputs["X"], comb.inputs["X"])
L.new(sep.outputs["Y"], comb.inputs["Y"])
L.new(comb.outputs[0], length.inputs[0])
outer = N.new("ShaderNodeMath")
outer.operation = "GREATER_THAN"
outer.inputs[1].default_value = 0.0588
inner = N.new("ShaderNodeMath")
inner.operation = "LESS_THAN"
inner.inputs[1].default_value = 0.0182
rim = N.new("ShaderNodeMath")
rim.operation = "MAXIMUM"
L.new(length.outputs["Value"], outer.inputs[0])
L.new(length.outputs["Value"], inner.inputs[0])
L.new(outer.outputs[0], rim.inputs[0])
L.new(inner.outputs[0], rim.inputs[1])

silver = N.new("ShaderNodeBsdfPrincipled")
silver.name = "Mirror"
silver.inputs["Base Color"].default_value = (0.9, 0.9, 0.92, 1.0)
silver.inputs["Metallic"].default_value = 1.0
silver.inputs["Roughness"].default_value = 0.08
mix = N.new("ShaderNodeMixShader")
L.new(rim.outputs[0], mix.inputs["Fac"])
L.new(printed.outputs["BSDF"], mix.inputs[1])
L.new(silver.outputs["BSDF"], mix.inputs[2])
L.new(mix.outputs["Shader"], out.inputs["Surface"])

disc = obj["Disc"]
if disc.data.users > 1:
    disc.data = disc.data.copy()
disc.data.materials.append(art)
art_index = len(disc.data.materials) - 1
data_index = list(disc.data.materials).index(bpy.data.materials["MAT_Disc"])
for poly in disc.data.polygons:  # label side faces up
    if poly.material_index == data_index and poly.normal.z > 0.5:
        poly.material_index = art_index

# ---------------------------------------------------------------- white studio
player_meshes = [o for o in obj if o.type == "MESH" and o.name != "Cube" and not o.hide_render]
floor_z = min((o.matrix_world @ Vector(c)).z for o in player_meshes for c in o.bound_box)

floor_mesh = bpy.data.meshes.new("Studio_Floor")
s = 3.0
floor_mesh.from_pydata([(-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0)], [], [(0, 1, 2, 3)])
floor = obj.new("Studio_Floor", floor_mesh)
floor.location.z = floor_z - 0.00005
bpy.data.collections["Studio"].objects.link(floor)

white = bpy.data.materials.new("MAT_StudioWhite")
white.use_nodes = True
wb = white.node_tree.nodes["Principled BSDF"]
wb.inputs["Base Color"].default_value = (0.97, 0.97, 0.97, 1.0)
wb.inputs["Roughness"].default_value = 0.42
wb.inputs["Specular IOR Level"].default_value = 0.25
floor_mesh.materials.append(white)

# camera rays see white; everything else keeps the studio HDRI for reflections in the glass
wn = sc.world.node_tree.nodes
wn["Background.001"].inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)

# Let light reach the disc through the clear lid: shadow rays pass straight through, camera and
# reflection rays still see the glass. Without this the art under the closed lid only gets noisy
# caustic light and reads dark and muddy. The body glass is left alone so the circuit board keeps
# its deep green.
for name in ("MAT_LidClear", "MAT_LidFrost"):
    m = bpy.data.materials.get(name)
    if not m:
        continue
    mt = m.node_tree
    mout = next(n for n in mt.nodes if n.type == "OUTPUT_MATERIAL" and n.is_active_output)
    link = mout.inputs["Surface"].links[0]
    glass_out = link.from_socket
    mt.links.remove(link)
    lp = mt.nodes.new("ShaderNodeLightPath")
    clear = mt.nodes.new("ShaderNodeBsdfTransparent")
    mx = mt.nodes.new("ShaderNodeMixShader")
    mt.links.new(lp.outputs["Is Shadow Ray"], mx.inputs["Fac"])
    mt.links.new(glass_out, mx.inputs[1])
    mt.links.new(clear.outputs["BSDF"], mx.inputs[2])
    mt.links.new(mx.outputs["Shader"], mout.inputs["Surface"])

# ---------------------------------------------------------------- camera rig
cam = obj["CD_Camera"]
pivot = obj.new("Cam_Pivot", None)
pivot.empty_display_size = 0.03
pivot.location = (0.0, 0.0, 0.012)
bpy.data.collections["Studio"].objects.link(pivot)
offset = cam.location - pivot.location
cam.parent = pivot
cam.location = offset
sc.camera = cam


def cam_at(frame, dist, tilt_deg, spin_deg, aim_y):
    key(cam, "location", frame, offset * dist)
    key(pivot, "rotation_euler", frame, (rad(tilt_deg), 0.0, rad(spin_deg)))
    key(pivot, "location", frame, (0.0, aim_y, 0.012))


# wide with headroom while the lid is open, then a slow push in on the spinning disc
CAM_KEYS = [  # frame, distance factor, tilt, spin, aim y
    (1, 1.80, -5.0, -8.0, 0.045),
    (100, 1.62, 0.0, -3.0, 0.035),
    (F_END, 1.22, 8.0, 4.0, 0.004),
]
for k in CAM_KEYS:
    cam_at(*k)

# ---------------------------------------------------------------- OPEN slider
slider = obj["Button_Open"]
y0 = slider.location.y
key(slider, "location", 4, y0, index=1)
key(slider, "location", 8, y0 - 0.0025, index=1)
key(slider, "location", 13, y0 - 0.0025, index=1)
key(slider, "location", 17, y0, index=1)

# ---------------------------------------------------------------- lid
lid = obj["Lid"]
OPEN = rad(-100.0)
key(lid, "rotation_euler", 1, 0.0, index=0)
key(lid, "rotation_euler", 10, 0.0, index=0, interp="BACK", easing="EASE_OUT", back=0.9)
key(lid, "rotation_euler", 34, OPEN, index=0)
key(lid, "rotation_euler", 86, OPEN, index=0, interp="CUBIC", easing="EASE_IN")
key(lid, "rotation_euler", 104, 0.0, index=0)
key(lid, "rotation_euler", 107, rad(-1.6), index=0)
key(lid, "rotation_euler", 111, 0.0, index=0)

# ---------------------------------------------------------------- disc placement
START = Vector((0.31, -0.015, 0.095))
HOVER = DISC_REST + Vector((0.0, 0.0, 0.013))
key(disc, "location", 1, START)
key(disc, "rotation_euler", 1, (rad(8.0), rad(-30.0), rad(75.0)))
key(disc, "location", 28, START)
key(disc, "rotation_euler", 28, (rad(8.0), rad(-30.0), rad(75.0)))
key(disc, "location", 66, HOVER)
key(disc, "rotation_euler", 66, (0.0, 0.0, rad(8.0)))
key(disc, "location", 76, DISC_REST)
key(disc, "rotation_euler", 76, (0.0, 0.0, 0.0))

# ---------------------------------------------------------------- PLAY key + CRT
play = obj["Button_PlayStop"]
z0 = play.location.z
key(play, "location", 117, z0, index=2)
key(play, "location", 120, z0 - 0.0013, index=2)
key(play, "location", 123, z0 - 0.0013, index=2)
key(play, "location", 127, z0, index=2)

# the play/stop key toggles: its play icon swaps to the stop icon when pressed
icon_play, icon_stop = obj.get("Icon_Play"), obj.get("Icon_Stop")
if icon_play and icon_stop:
    for icon, before, after in ((icon_play, False, True), (icon_stop, True, False)):
        for f, hidden in ((1, before), (121, before), (122, after)):
            icon.hide_render = hidden
            icon.keyframe_insert("hide_render", frame=f)
            icon.hide_viewport = hidden
            icon.keyframe_insert("hide_viewport", frame=f)

crt = bpy.data.materials["MAT_CRTScreen"]
crt_bsdf = crt.node_tree.nodes["Principled BSDF"]
emit = crt_bsdf.inputs["Emission Strength"]
E_ON = emit.default_value if emit.default_value > 0 else 2.0
print("CRT emission on-strength", E_ON)
for f, v in [(1, 0.0), (121, 0.0), (122, E_ON * 0.7), (123, E_ON * 0.08), (124, E_ON * 0.9),
             (125, E_ON * 0.35), (127, E_ON)]:
    key_socket(crt.node_tree, emit, f, v, interp="CONSTANT")

# ---------------------------------------------------------------- disc spin (clockwise seen from above)
SPIN_START = 122
RAMP = 42
OMEGA = -2 * math.pi * 1.5 / FPS  # 1.5 rev/s, radians per frame
angle = 0.0
key(disc, "rotation_euler", SPIN_START - 1, 0.0, index=2, interp="LINEAR")
for f in range(SPIN_START, F_END + 2):
    t = min(1.0, (f - SPIN_START + 1) / RAMP)
    ease = t * t * (3 - 2 * t)
    angle += OMEGA * ease
    key(disc, "rotation_euler", f, angle, index=2, interp="LINEAR")

# keep the tone of the original bloom but softer against a bright set
comp = getattr(sc, "compositing_node_group", None)
if comp and "Glare" in comp.nodes:
    g = comp.nodes["Glare"]
    g.inputs["Strength"].default_value = 0.35
    g.inputs["Threshold"].default_value = 2.5

sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND, relative_remap=True, compress=True)
print("SAVED", OUT_BLEND, "floor_z", round(floor_z, 5), "art slot", art_index)
