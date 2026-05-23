import { NextResponse } from "next/server";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(
  error: string,
  status = 400,
): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error }, { status });
}

// Aliases (used by newer routes; same payload shape).
export function successResponse<T>(
  data: T,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  error: string,
  status = 400,
): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error }, { status });
}
