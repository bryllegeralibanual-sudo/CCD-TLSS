import { useState, useMemo, useCallback } from 'react'
import { Zap, Check, X, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react'
import { useData } from '../../data/DataContext'
import { useTheme } from '../../context/ThemeContext'
import { AIAssignmentEngine } from '../../utils/AIAssignmentEngine'
import { PROGRAMS } from '../../data/programs'

const FOREST = '#033826'
const MID_GREEN = '#0F6B3C'
const GOLD = '#D9B44A'

function card(dark) {
  return `rounded-2xl border p-5 transition-all duration-200 ${
    dark ? 'bg-[#101F18] border-emerald-900/50 hover:border-emerald-700/50' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow'
  }`
}

export default function AIAssignmentPage() {
  const { dark } = useTheme()
  const { term, faculty, termAssignments, subjectsById, facultyById } = useData()
  const [selectedProgram, setSelectedProgram] = useState(PROGRAMS[0]?.code || '')
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'high', 'medium', 'low'

  // Get unassigned subjects
  const unassignedSubjects = useMemo(() => {
    const allSubjects = Object.values(subjectsById).filter(s => s.prog === selectedProgram)
    const ta = termAssignments(term.ay, term.sem)
    const assignedSubjectIds = new Set(ta.map(a => a.subjectId))

    return allSubjects.filter(s => !assignedSubjectIds.has(s.id))
  }, [selectedProgram, term, subjectsById, termAssignments])

  // Generate recommendations
  const handleGenerateRecommendations = useCallback(() => {
    setLoading(true)

    // Simulate processing time
    setTimeout(() => {
      try {
        const engine = new AIAssignmentEngine(
          faculty,
          Object.values(subjectsById),
          termAssignments(term.ay, term.sem),
          subjectsById,
          facultyById,
          18 // max units
        )

        const recs = engine.generateAssignments(unassignedSubjects, selectedProgram, term.sem)
        setRecommendations(recs.map(r => ({ ...r, accepted: false })))
      } catch (err) {
        console.error('AI Assignment Error:', err)
        alert('Error generating recommendations')
      }
      setLoading(false)
    }, 1000)
  }, [faculty, subjectsById, termAssignments, term, selectedProgram, unassignedSubjects, facultyById])

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(r => {
      if (filter === 'high') return r.confidence >= 80
      if (filter === 'medium') return r.confidence >= 60 && r.confidence < 80
      if (filter === 'low') return r.confidence < 60
      return true
    })
  }, [recommendations, filter])

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return dark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
    if (conf >= 60) return dark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'
    return dark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
  }

  const getConfidenceLabel = (conf) => {
    if (conf >= 80) return 'High confidence'
    if (conf >= 60) return 'Medium confidence'
    return 'Low confidence'
  }

  return (
    <div className={`space-y-6 p-6 ${dark ? 'bg-[#0a1410]' : 'bg-gradient-to-br from-emerald-50/40 to-blue-50/40'}`}>
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${dark ? 'text-white' : 'text-[#10241A]'}`}
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          <Zap size={32} style={{ color: GOLD }} />
          AI Auto Assignment
        </h1>
        <p className={`text-sm ${dark ? 'text-emerald-200/60' : 'text-gray-600'}`}>
          Let AI intelligently assign unassigned subjects to faculty based on specialization and workload
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <div className={`${card(dark)} lg:col-span-1`}>
          <h3 className={`font-bold text-sm mb-4 ${dark ? 'text-white' : 'text-[#10241A]'}`}
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Configuration</h3>

          {/* Program Selector */}
          <div className="mb-4">
            <label className={`text-xs font-semibold block mb-2 ${dark ? 'text-emerald-200' : 'text-gray-700'}`}>
              Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value)
                setRecommendations([])
              }}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                dark
                  ? 'bg-emerald-900/20 border border-emerald-700/40 text-white'
                  : 'bg-gray-100 border border-gray-200 text-gray-900'
              }`}
            >
              {PROGRAMS.map(p => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className={`space-y-2 mb-4 p-3 rounded-lg ${dark ? 'bg-emerald-900/20 border border-emerald-700/30' : 'bg-emerald-50 border border-emerald-200'}`}>
            <div className="flex justify-between text-xs">
              <span className={dark ? 'text-emerald-200/60' : 'text-gray-600'}>Unassigned subjects:</span>
              <span className={`font-semibold ${dark ? 'text-emerald-100' : 'text-gray-800'}`}>{unassignedSubjects.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className={dark ? 'text-emerald-200/60' : 'text-gray-600'}>Faculty available:</span>
              <span className={`font-semibold ${dark ? 'text-emerald-100' : 'text-gray-800'}`}>{faculty.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className={dark ? 'text-emerald-200/60' : 'text-gray-600'}>Recommendations:</span>
              <span className={`font-semibold ${dark ? 'text-emerald-100' : 'text-gray-800'}`}>{filteredRecommendations.length}</span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateRecommendations}
            disabled={loading || unassignedSubjects.length === 0}
            className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
              loading || unassignedSubjects.length === 0
                ? dark ? 'bg-emerald-900/20 text-emerald-400/50 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : dark ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="inline mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={14} className="inline mr-2" />
                Generate AI Recommendations
              </>
            )}
          </button>

          {/* Filter Buttons */}
          {recommendations.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className={`text-xs font-semibold ${dark ? 'text-emerald-200' : 'text-gray-700'}`}>Filter by confidence:</p>
              <div className="space-y-1">
                {['all', 'high', 'medium', 'low'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`w-full px-3 py-2 rounded text-xs font-semibold transition-all ${
                      filter === f
                        ? dark ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white'
                        : dark ? 'bg-emerald-900/20 text-emerald-300 hover:bg-emerald-900/40' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommendations List */}
        <div className={`${card(dark)} lg:col-span-3 space-y-3`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold text-sm ${dark ? 'text-white' : 'text-[#10241A]'}`}
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              AI Recommendations
            </h3>
            {recommendations.length > 0 && (
              <span className={`text-xs px-2 py-1 rounded-lg ${dark ? 'bg-emerald-900/30 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                {filteredRecommendations.length} of {recommendations.length}
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredRecommendations.length > 0 ? (
              filteredRecommendations.map((rec, idx) => {
                const subject = subjectsById[rec.subject_id]
                const fac = facultyById[rec.faculty_id]

                return (
                  <div key={idx} className={`p-4 rounded-lg border ${dark ? 'bg-emerald-900/20 border-emerald-700/40' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${dark ? 'text-emerald-100' : 'text-emerald-900'}`}>
                          {subject?.code} - {subject?.title}
                        </p>
                        <p className={`text-xs mt-1 ${dark ? 'text-emerald-200/60' : 'text-emerald-700'}`}>
                          Assigned to: <span className="font-semibold">{fac?.name}</span>
                        </p>
                        {rec.reasoning && (
                          <div className={`text-xs mt-2 space-y-1 ${dark ? 'text-emerald-200/50' : 'text-emerald-600'}`}>
                            <p>• Specialization match: {rec.reasoning.specialization}%</p>
                            <p>• Current workload: {rec.reasoning.workload} units</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(rec.confidence)}`}>
                          {getConfidenceLabel(rec.confidence)}
                        </span>
                        <span className={`text-lg font-bold ${dark ? 'text-emerald-200' : 'text-emerald-700'}`}>
                          {Math.round(rec.confidence)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                        rec.accepted
                          ? dark ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 'bg-green-100 text-green-700 border border-green-300'
                          : dark ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                        onClick={() => setRecommendations(recommendations.map((r, i) => i === idx ? { ...r, accepted: true } : r))}
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                        dark ? 'bg-red-900/20 text-red-300 hover:bg-red-900/40' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                        onClick={() => setRecommendations(recommendations.filter((_, i) => i !== idx))}
                      >
                        <X size={12} /> Reject
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className={`flex items-center justify-center py-12 ${dark ? 'text-emerald-200/40' : 'text-gray-400'}`}>
                <AlertCircle size={20} className="mr-2" />
                {recommendations.length === 0
                  ? 'Generate recommendations to see AI suggestions'
                  : 'No recommendations match the selected filter'}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {recommendations.length > 0 && (
            <div className={`flex gap-2 pt-4 border-t ${dark ? 'border-emerald-900/30' : 'border-gray-200'}`}>
              <button className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                dark ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}>
                Review All
              </button>
              <button className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                dark ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}>
                Apply Recommendations
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className={`${card(dark)} flex items-start gap-3`}>
        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
        <div>
          <p className={`text-sm font-semibold ${dark ? 'text-emerald-100' : 'text-gray-800'}`}>How AI Assignment Works</p>
          <p className={`text-xs mt-1 ${dark ? 'text-emerald-200/60' : 'text-gray-600'}`}>
            Our AI engine analyzes faculty specializations, current workload, teaching year preferences, and program requirements to generate optimal recommendations. You can review and reject any recommendation before applying. Once applied, assignments start in draft status. Review them in the Load Assignment page, then submit to program head for final approval.
          </p>
        </div>
      </div>
    </div>
  )
}
