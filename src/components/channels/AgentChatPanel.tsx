import { useEffect, useRef } from 'react'
import { useExplanationStore } from '../../store/useExplanationStore'
import { usePromptStore } from '../../store/usePromptStore'

const AGENT_COLORS: Record<string, string> = {
    Operational: '#0284c7',
    Comfort: '#16a34a',
    Minimalist: '#dc2626',
    Concierge: '#d97706',
    Technical: '#9333ea',
}

export function AgentChatPanel() {
    const { current, history, loading, revealedMessages, consensusReached, setRevealedMessages, setConsensusReached } = useExplanationStore()
    const currentPersonality = usePromptStore(s => s.personality)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [current, history, revealedMessages])

    const chatMessages = current?.agentConversation || []

    useEffect(() => {
        if (!current || loading || chatMessages.length === 0) return

        if (revealedMessages < chatMessages.length) {
            const timer = setTimeout(() => {
                setRevealedMessages(revealedMessages + 1)
            }, 1500)
            return () => clearTimeout(timer)
        } else if (revealedMessages === chatMessages.length && !consensusReached) {
            const timer = setTimeout(() => {
                setConsensusReached(true)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [current, loading, chatMessages.length, revealedMessages, consensusReached, setRevealedMessages, setConsensusReached])

    const visibleMessages = chatMessages.slice(0, revealedMessages)

    return (
        <div style={{
            flex: 1,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderLeft: '1px solid #e0e0e0',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '20px 16px',
                borderBottom: '1px solid #e0e0e0',
                background: '#fafafa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ color: '#111', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>Ensemble_Deliberation</strong>
                    <span style={{ fontSize: '10px', color: '#888', marginTop: 4, fontFamily: 'monospace' }}>
                        POLICY: <span style={{ color: '#0284c7' }}>{currentPersonality.toUpperCase()}</span>
                    </span>
                </div>
                <div style={{ fontSize: '9px', color: '#aaa', fontFamily: 'monospace' }}>
                    STATUS: {loading ? 'ANALYZING' : (consensusReached ? 'RESOLVED' : 'WAITING')}
                </div>
            </div>

            <div ref={scrollRef} className="custom-scrollbar" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
            }}>
                {loading && (
                    <div style={{ color: '#999', fontSize: 11, textAlign: 'center', fontFamily: 'monospace' }}>
                        [LOADING_NEURAL_WEIGHTS...]
                    </div>
                )}

                {!loading && chatMessages.length === 0 && (
                    <div style={{ color: '#bbb', fontSize: 11, textAlign: 'center', fontFamily: 'monospace', marginTop: 100 }}>
                        SYSTEM_IDLE: NO_ACTIVE_INCIDENTS
                    </div>
                )}

                {visibleMessages.map((msg, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        animation: 'fadeIn 0.3s ease-out forwards'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: AGENT_COLORS[msg.speaker] || '#888',
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                                fontFamily: 'monospace'
                            }}>
                                {msg.speaker}_AGENT
                            </span>
                            <span style={{ fontSize: '9px', color: '#bbb' }}>{new Date().toLocaleTimeString()}</span>
                        </div>
                        <div style={{
                            background: '#f8f9fa',
                            padding: '12px 14px',
                            borderRadius: '4px',
                            color: '#333',
                            fontSize: '13px',
                            lineHeight: 1.6,
                            border: `1px solid #e0e0e0`,
                            borderLeft: `2px solid ${AGENT_COLORS[msg.speaker] || '#888'}`
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {revealedMessages > 0 && !consensusReached && (
                    <div style={{ color: '#aaa', fontSize: 10, fontFamily: 'monospace', paddingLeft: 4 }}>
                        {'>'} SYNCING_COMMUNICATIONS...
                    </div>
                )}

                {consensusReached && (
                    <div style={{
                        marginTop: 10,
                        border: '1px dashed #c0e0c0',
                        padding: '12px',
                        background: 'rgba(74, 222, 128, 0.06)',
                        borderRadius: '4px'
                    }}>
                        <span style={{ color: '#16a34a', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 0.5 }}>
                            RESOLVED: Consensus reached. Broadcasting finalized content to interface channels.
                        </span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #aaa;
                }
            `}</style>
        </div>
    )
}
