import { useEffect, useRef } from 'react'
import { useExplanationStore } from '../../store/useExplanationStore'
import { usePromptStore } from '../../store/usePromptStore'

const AGENT_COLORS: Record<string, string> = {
    Operational: '#3b82f6', // blue
    Comfort: '#10b981',     // green
    Minimalist: '#ef4444',  // red
    Concierge: '#f59e0b',   // amber
    Technical: '#8b5cf6',   // purple
}

export function AgentChatPanel() {
    const { current, history, loading, revealedMessages, consensusReached, setRevealedMessages, setConsensusReached } = useExplanationStore()
    const currentPersonality = usePromptStore(s => s.personality)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [current, history])

    const chatMessages = current?.agentConversation || []

    useEffect(() => {
        // If there's no chat, do nothing
        if (!current || loading || chatMessages.length === 0) return

        if (revealedMessages < chatMessages.length) {
            const timer = setTimeout(() => {
                setRevealedMessages(revealedMessages + 1)
            }, 1500) // 1.5s delay between messages
            return () => clearTimeout(timer)
        } else if (revealedMessages === chatMessages.length && !consensusReached) {
            const timer = setTimeout(() => {
                setConsensusReached(true)
            }, 1000) // 1s delay before consensus message pops
            return () => clearTimeout(timer)
        }
    }, [current, loading, chatMessages.length, revealedMessages, consensusReached, setRevealedMessages, setConsensusReached])

    const visibleMessages = chatMessages.slice(0, revealedMessages)

    return (
        <div style={{
            width: 350,
            background: '#111827',
            borderLeft: '1px solid #1f2937',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}>
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #1f2937',
                display: 'flex',
                flexDirection: 'column',
            }}>
                <strong style={{ color: '#f3f4f6', fontSize: '15px' }}>Team Communications</strong>
                <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: 4 }}>
                    Lead Agent: <span style={{ color: '#3b82f6', textTransform: 'capitalize' }}>{currentPersonality}</span>
                </span>
            </div>

            <div ref={scrollRef} style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}>
                {loading && (
                    <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                        Agents are analyzing the situation...
                    </div>
                )}

                {!loading && chatMessages.length === 0 && (
                    <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center' }}>
                        No active communications. Play the scenario to trigger an event.
                    </div>
                )}

                {visibleMessages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: AGENT_COLORS[msg.speaker] || '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                        }}>
                            {msg.speaker} Agent
                        </span>
                        <div style={{
                            background: '#1f2937',
                            padding: '10px 12px',
                            borderRadius: '0 8px 8px 8px',
                            color: '#d1d5db',
                            fontSize: 13,
                            lineHeight: 1.5,
                            borderLeft: `3px solid ${AGENT_COLORS[msg.speaker] || '#9ca3af'}`
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {revealedMessages > 0 && !consensusReached && (
                    <div style={{ color: '#9ca3af', fontSize: 13, fontStyle: 'italic', paddingLeft: 12 }}>
                        Agents deliberating...
                    </div>
                )}

                {consensusReached && (
                    <div style={{ marginTop: 8, borderTop: '1px solid #374151', paddingTop: 12 }}>
                        <span style={{ color: '#10b981', fontSize: 11, fontWeight: 'bold' }}>SYSTEM: Consensus reached. Proceeding to broadcast to passengers.</span>
                    </div>
                )}
            </div>
        </div>
    )
}
