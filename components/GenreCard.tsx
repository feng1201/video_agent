'use client'

interface Props {
  genre: string
  description: string
  selected: boolean
  onClick: () => void
}

export default function GenreCard({ genre, description, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border-2 text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-800'
          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
      }`}
    >
      <div className="font-semibold text-sm">{genre}</div>
      <div className="text-xs text-gray-500 mt-0.5">{description}</div>
    </button>
  )
}
