"use client";
import {useSearchParams} from "next/navigation";
import {useRouter} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";
import React, {Suspense, useEffect, useState} from "react";
import {Pagination} from "@/components";
import {AuthUtil} from "@/components/auth";
import {fetchApplicationDetails, fetchPrograms} from "@/utils";
import {ApplicationDetails, Program} from "@/types";
import Loading from "../loading";

const ITEMS_PER_PAGE = 10;

export default function ApplcnPage() {
  const lang = useLocale();
  AuthUtil({failedRedirectUrl: `/${lang}/login`});

  const showTooltip = (event: React.MouseEvent<HTMLTableCellElement, MouseEvent>, content: string) => {
    const target = event.target as HTMLTableCellElement;

    // Check if content exceeds cell width
    if (target.offsetWidth < target.scrollWidth) {
      const tooltipText = content;

      // Create tooltip element
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.textContent = tooltipText || "";

      // Position tooltip above the cursor
      tooltip.style.position = "absolute";
      tooltip.style.top = `${event.clientY - 20}px`;
      tooltip.style.left = `${event.clientX}px`;

      // Append tooltip to body
      document.body.appendChild(tooltip);
    }
  };
  const hideTooltip = () => {
    const tooltips = document.querySelectorAll(".tooltip");
    tooltips.forEach((tooltip) => {
      tooltip.remove();
    });
  };

  const searchParams = useSearchParams();
  const programid = searchParams.get("programid") || ""; // Default to empty string if undefined
  // const currentPage = Number(pageParam) || 1;

  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const [applications, setApplications] = useState<ApplicationDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [paginatedApplications, setPaginatedApplications] = useState<ApplicationDetails[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortedColumn, setSortedColumn] = useState<string | null>(null);

  const t = useTranslations();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const allPrograms: Program[] = await fetchPrograms();
        const selectedProgram = allPrograms.find((p) => p.id === Number(programid));
        const selectedProgramName = selectedProgram ? selectedProgram.name : null;

        const allApplications: ApplicationDetails[] = await fetchApplicationDetails();
        const filteredApplications = selectedProgramName
          ? allApplications.filter((app) => app.program_name === selectedProgramName)
          : [];

        setApplications(filteredApplications);
        setTotalPages(Math.ceil(filteredApplications.length / ITEMS_PER_PAGE));
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching applications details:", error);
      }
    };

    fetchData();
  }, [programid]);

  useEffect(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setPaginatedApplications(applications.slice(start, end));
  }, [currentPage, applications]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`?programid=${programid}&page=${page}`);
  };

  useEffect(() => {
    // Filter programs based on search query
    const filtered = applications.filter((application) =>
      application.program_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalFilteredPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    setTotalPages(totalFilteredPages);

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    // Slice the filtered programs based on pagination
    const paginated = filtered.slice(start, end);

    // Update paginated programs state
    setPaginatedApplications(paginated);
  }, [currentPage, applications, searchQuery]);

  const isDataEmpty = !Array.isArray(applications) || applications.length < 1 || !applications;

  function getStatusClass(status: string) {
    switch (status) {
      case "completed":
        return "completedButton";
      case "active":
      case "inprogress":
        return "appliedButton";
      case "rejected":
        return "rejectedButton";
      default:
        return "";
    }
  }

  function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
  }

  function getTransformedStatus(status: string) {
    if (status === "active" || status === "inprogress") {
      return "Applied";
    }
    return toTitleCase(status);
  }
  const sortApplications = (column: string) => {
    const order = column === sortedColumn && sortOrder === "asc" ? "desc" : "asc";
    const sortedApplications = [...applications].sort((a, b) => {
      if (column === "program_name") {
        return order === "asc"
          ? a.program_name.localeCompare(b.program_name)
          : b.program_name.localeCompare(a.program_name);
      } else if (column === "application_status") {
        return order === "asc"
          ? getTransformedStatus(a.application_status).localeCompare(
              getTransformedStatus(b.application_status)
            )
          : getTransformedStatus(b.application_status).localeCompare(
              getTransformedStatus(a.application_status)
            );
      } else if (column === "application_id") {
        return order === "asc" ? a.application_id - b.application_id : b.application_id - a.application_id;
      } else if (column === "date_applied") {
        const dateA = new Date(a.date_applied).getTime();
        const dateB = new Date(b.date_applied).getTime();
        return order === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    setApplications(sortedApplications);
    setSortOrder(order);
    setSortedColumn(column);
  };

  return (
    <div>
      {isLoading ? (
        <div className="mt-16 flex justify-center items-center flex-col gap-2" />
      ) : !isDataEmpty ? (
        <div
          className=" m-6 p-6 md:space-x-4 mx-auto max-w-screen-xl flex justify-center items-center"
          style={{marginTop: "24px", marginBottom: "0px"}}
        >
          <div className="bg-brand container w-1180 shadow-md  pb-0 rounded-lg top-24">
            <div className="flex flex-wrap justify-between items-center" style={{height: "56px"}}>
              <p
                className="font-fontcustom m-4"
                style={{
                  top: "226px",
                  left: "159px",
                  width: "98px",
                  height: "20px",
                  textAlign: "left",
                  font: "normal normal 600 16px/20px Inter",
                  letterSpacing: "0px",
                  color: "#484848",
                  opacity: "1",
                  whiteSpace: "nowrap",
                  marginLeft: "24px",
                }}
              >
                {t("My Application")}
              </p>
              {/* <div className="flex-1 flex justify-end">
                <SearchBar />
              </div> */}
              <div className="relative" style={{marginTop: "10px", marginRight: "10px"}}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder={t("Search by program name")}
                  className="border border-gray-300 rounded-md px-2 py-1 pl-8" // Added pl-8 to accommodate icon width
                  style={{height: "45px", fontSize: "15px"}}
                />
                <div
                  className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none"
                  style={{
                    color: "#000", // Icon color
                  }}
                >
                  <svg
                    className="h-4 w-4" // Icon size
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 19l-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                  </svg>
                </div>
              </div>
            </div>
            <Suspense fallback={<Loading />}>
              <div className="m-4 md:space-x-8 mx-auto max-w-screen-xl flex justify-center items-center relative overflow-x-auto  ">
                <table className=" w-full  text-sm text-left text-gray-600 ">
                  <thead className="text-xs text-gray-600 bg-gray-100" style={{height: "56px"}}>
                    <tr>
                      <th scope="col" className="columnTitle px-6 py-3 ">
                        {t("No_")}
                      </th>
                      <th scope="col" className="columnTitle px-6 py-3 ">
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => sortApplications("program_name")}
                        >
                          {t("Program Name")}
                          <svg
                            data-column="0"
                            className="w-3 h-3 ml-1.5  text-gray-600  sortable-icon"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                          </svg>
                        </div>
                      </th>
                      <th scope="col" className="columnTitle px-6 py-3">
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => sortApplications("application_status")}
                        >
                          {t("Application Status")}
                          <svg
                            data-column="1"
                            className="w-3 h-3 ml-1.5  text-gray-600  sortable-icon"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                          </svg>
                        </div>
                      </th>
                      <th scope="col" className="columnTitle px-6 py-3">
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => sortApplications("application_id")}
                        >
                          {t("Application ID")}
                          <svg
                            data-column="2"
                            className="w-3 h-3 ml-1.5  text-gray-600  sortable-icon"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                          </svg>
                        </div>
                      </th>
                      <th scope="col" className="columnTitle px-6 py-3">
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => sortApplications("date_applied")}
                        >
                          {t("Date Applied")}
                          <svg
                            data-column="3"
                            className="w-3 h-3 ml-1.5  text-gray-600  sortable-icon"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                          </svg>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedApplications.map((application, index) => {
                      const itemNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                      return (
                        <tr
                          key={index}
                          className="bg-white border-b dark:bg-white-200 dark:border-white-200 text-gray-600"
                          style={{height: "44px"}}
                        >
                          <td className="px-6 py-4 snoElement">{itemNumber}</td>
                          <td
                            scope="row"
                            className="rowElement px-6 py-4 "
                            style={{
                              maxWidth: "300px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            data-tooltip={application.program_name} // Add data-tooltip attribute
                            onMouseEnter={(e) => showTooltip(e, application.program_name)}
                            onMouseLeave={() => hideTooltip()} // Hide tooltip on mouse leave
                          >
                            {application.program_name}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              className={`top-14 text-xs  w-24 h-8 rounded-md text-center tracking-[0px] opacity-100 border-collapse border-[none] left-[811px] text-white ${getStatusClass(application.application_status)}`}
                              disabled={true}
                            >
                              {application.application_status === "active" ||
                              application.application_status === "inprogress"
                                ? "Applied"
                                : toTitleCase(application.application_status)}
                            </button>
                          </td>
                          <td className="px-6 py-4">{application.application_id}</td>
                          <td className="px-6 py-4">{new Date(application.date_applied).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Suspense>
            {paginatedApplications.length === 0 && applications.length > 0 && (
              <p className="text-center text-gray-600" style={{marginBottom: "20px"}}>
                {t("No results found")}
              </p>
            )}
            {paginatedApplications.length > 0 && (
              <div className="p-2 snoElement">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-16 flex justify-center items-center flex-col gap-2 ">
          <h2 className="tetx-black text-xl font-bold"></h2>
        </div>
      )}
    </div>
  );
}
