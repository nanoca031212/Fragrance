import Image from "next/image";

interface FooterTPSProps {
  className?: string;
}

export default function FooterTPS({ className = "" }: FooterTPSProps) {
  return (
    <footer className={`${className} bg-black`}>
      <Image
        src="/images/footer.jpeg"
        alt="The Perfume Shop Footer"
        width={1920}
        height={600}
        className="w-full object-cover"
        priority={false}
      />
    </footer>
  );
}
