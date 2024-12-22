import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

interface PlaylistPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PlaylistPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PlaylistPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <Pagination className="mt-6" role="navigation" aria-label="Playlist sayfaları">
      <PaginationContent>
        <PaginationItem>
          <Button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Önceki sayfa"
          >
            <PaginationPrevious />
          </Button>
        </PaginationItem>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <PaginationItem key={page}>
                <Button
                  onClick={() => onPageChange(page)}
                  aria-label={`Sayfa ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  <PaginationLink isActive={currentPage === page}>
                    {page}
                  </PaginationLink>
                </Button>
              </PaginationItem>
            );
          }
          return null;
        })}

        <PaginationItem>
          <Button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Sonraki sayfa"
          >
            <PaginationNext />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};