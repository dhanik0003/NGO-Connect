import { motion, useInView } from "motion/react";
import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  blur?: number;
}

export function TextReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.08,
  blur = 10,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const words = useMemo(() => text.split(" "), [text]);

  return (
    <span ref={ref} className={cn("inline-flex flex-wrap justify-center gap-x-[0.24em] gap-y-[0.08em]", className)}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="overflow-hidden pb-[0.08em]">
          <motion.span
            className={cn("inline-block will-change-transform", wordClassName)}
            initial={{ opacity: 0, y: "118%", filter: `blur(${blur}px)` }}
            animate={isInView ? { opacity: 1, y: "0%", filter: "blur(0px)" } : undefined}
            transition={{
              duration: 0.8,
              delay: delay + index * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
