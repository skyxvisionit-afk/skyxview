import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const channelName = searchParams.get('channelName')
    const uid = searchParams.get('uid') || '0' // Default to 0

    if (!channelName) {
        return NextResponse.json({ error: 'channelName is required' }, { status: 400 })
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appId || !appCertificate) {
        console.error('Agora App ID or Certificate missing in environment variables')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const role = RtcRole.PUBLISHER
    const expirationTimeInSeconds = 3600
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    try {
        // Force UID=0. In Agora, a token generated with UID=0 allows ANY integer UID to connect,
        // or if joining the channel with UID=null/undefined, Agora will auto-assign one uniquely.
        const numericUid = 0

        const token = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            numericUid,
            role,
            privilegeExpiredTs,
            privilegeExpiredTs
        )

        return NextResponse.json({ token })
    } catch (error) {
        console.error('Error generating Agora token:', error)
        return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
    }
}
