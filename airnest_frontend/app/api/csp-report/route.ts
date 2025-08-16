import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();

    // 打印CSP违规报告到控制台
    console.log('CSP Violation Report:', JSON.stringify(report, null, 2));

    // 在实际应用中，您可能想要将这些报告保存到日志或数据库

    return new NextResponse(JSON.stringify({ status: 'received' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return new NextResponse(JSON.stringify({ error: 'Invalid report' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
