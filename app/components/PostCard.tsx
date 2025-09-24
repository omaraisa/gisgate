interface PostCardProps {
  title: string;
  link: string;
  image?: string;
}

export default function PostCard({ title, link, image }: PostCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {image && (
        <img src={image} alt={title} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          <a href={link} className="hover:text-blue-600">{title}</a>
        </h3>
      </div>
    </div>
  );
}
