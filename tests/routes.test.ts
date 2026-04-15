import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/project-service", () => ({
  ProjectService: {
    createProject: vi.fn(async () => ({
      id: "project_1",
      status: "draft",
    })),
    listProjects: vi.fn(async () => []),
  },
}));

vi.mock("@/services/generation-service", () => ({
  GenerationService: vi.fn().mockImplementation(() => ({
    generateCopy: vi.fn(async () => ({
      id: "project_1",
      status: "copy_ready",
      title: "Portable Blender",
      productName: "Portable Blender",
      productInput: "USB-C",
      sourceImageUrl: null,
      sellingPoints: [],
      images: [],
    })),
  })),
}));

describe("API routes", () => {
  it("creates a project", async () => {
    const route = await import("@/app/api/projects/route");
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Portable Blender Main Images",
        productName: "Portable Blender",
        productInput: "USB-C 充电便携榨汁机",
      }),
    });

    const response = await route.POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.success).toBe(true);
    expect(payload.data.id).toBe("project_1");
  });

  it("generates copy for a project", async () => {
    const route = await import("@/app/api/projects/[id]/generate-copy/route");
    const request = new Request("http://localhost/api/projects/project_1/generate-copy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ replace: false }),
    });

    const response = await route.POST(request, {
      params: Promise.resolve({ id: "project_1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.project.status).toBe("copy_ready");
  });
});
