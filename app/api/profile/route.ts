import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findOne({
      email: session.user.email,
    }).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        address: user.address || "",
        organizationName: user.organizationName || "",
        latitude: typeof user.latitude === "number" ? user.latitude : null,
        longitude: typeof user.longitude === "number" ? user.longitude : null,
        shelterCapacity:
          typeof user.shelterCapacity === "number" ? user.shelterCapacity : null,
        shelterCapacityUnit: user.shelterCapacityUnit || null,
      },
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      name,
      phone,
      address,
      organizationName,
      latitude,
      longitude,
      shelterCapacity,
      shelterCapacityUnit,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({
      email: session.user.email,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    user.name = name.trim();
    user.phone =
      typeof phone === "string" ? phone.trim() : "";

    user.address =
      typeof address === "string"
        ? address.trim()
        : "";

    user.organizationName =
      typeof organizationName === "string"
        ? organizationName.trim()
        : "";

    if (typeof latitude === "number" && typeof longitude === "number") {
      user.latitude = latitude;
      user.longitude = longitude;
    } else if (latitude === null && longitude === null) {
      user.latitude = undefined;
      user.longitude = undefined;
    }

    if (user.role === "shelter") {
      if (
        typeof shelterCapacity === "number" &&
        (shelterCapacityUnit === "meals" || shelterCapacityUnit === "kg")
      ) {
        user.shelterCapacity = shelterCapacity;
        user.shelterCapacityUnit = shelterCapacityUnit;
      } else if (shelterCapacity === null) {
        user.shelterCapacity = undefined;
        user.shelterCapacityUnit = undefined;
      }
    }

    await user.save();

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        address: user.address || "",
        organizationName: user.organizationName || "",
        latitude: typeof user.latitude === "number" ? user.latitude : null,
        longitude: typeof user.longitude === "number" ? user.longitude : null,
        shelterCapacity:
          typeof user.shelterCapacity === "number" ? user.shelterCapacity : null,
        shelterCapacityUnit: user.shelterCapacityUnit || null,
      },
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}