# Reflection Simulator

An interactive geometric ray tracer and wave optics sandbox that visualizes reflection mechanics off planar, concave, convex, and parabolic mirrors.

## 📐 Mathematical & Physical Background

### 1. The Law of Reflection
For any mirror boundary:
$$\theta_i = \theta_r$$

Where:
* $\theta_i$ is the angle of incidence relative to the surface normal.
* $\theta_r$ is the angle of reflection relative to the surface normal.

In vector space, a ray traveling in direction $\vec{d}$ reflecting off a boundary with unit normal vector $\hat{n}$ is reflected in direction $\vec{d}_r$:
$$\vec{d}_r = \vec{d} - 2(\vec{d} \cdot \hat{n})\hat{n}$$

### 2. Curved Mirror Image Formation
For spherical mirrors with radius of curvature $R$ and focal length $f = R/2$:
$$\frac{1}{d_o} + \frac{1}{d_i} = \frac{1}{f}$$

Where:
* $d_o$ is the object distance from the mirror vertex.
* $d_i$ is the image distance from the mirror vertex (positive for real images in front, negative for virtual images behind).
* $f$ is the focal length (positive for concave mirrors, negative for convex mirrors).

The lateral magnification $m$ is given by:
$$m = -\frac{d_i}{d_o} = \frac{h_i}{h_o}$$

Where:
* $h_o$ is the object height.
* $h_i$ is the image height (negative for inverted images).

### 3. Spherical Aberration vs. Parabolic Mirror
* **Spherical Aberration**: Spherical mirrors fail to focus parallel incident rays that are far from the principal axis (marginal rays) to a single point.
* **Parabolic Mirror**: By shaping the mirror curve as a parabola ($y^2 = 4fx$), *all* parallel rays reflect precisely to the focal point $F$, eliminating spherical aberration entirely.

---

## 🎨 Simulation Modes & Configurations

1. **Ray Optics Mode (Geometric Ray Tracing)**:
   - **Interactive Object**: Drag the object arrow to see principal rays (parallel, focal, center) trace and form real/virtual images.
   - **Beam Tracer**: Shoot a collimated beam (multiple parallel rays) at any angle and check focal converge or divergence.
   - **90° Retroreflector**: Fire rays at two orthogonal mirrors and watch them reflect back parallel to the source.

2. **Wave Optics Mode (Huygens Sandbox)**:
   - Visualizes waves as expanding circles or plane sheets.
   - Computes reflection boundaries geometrically, flipping wave front curvatures as they bounce off concave/convex surfaces.
