import Image from 'next/image';

interface PostCardProps {
  title: string;
  link: string;
  image?: string;
}

export default function PostCard({ title, link, image }: PostCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-primary-50 rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:shadow-primary-200/50 transition-all duration-300 border border-primary-100">
      {image && (
        <Image src={image} alt={title} width={400} height={192} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-primary-800 mb-2">
          <a href={link} className="hover:text-secondary-600 transition-colors duration-200">{title}</a>
        </h3>
      </div>
    </div>
  );
}
