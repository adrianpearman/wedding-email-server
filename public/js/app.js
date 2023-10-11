const app = {
  populateGuests: (guestData) => {
    const {
      confirmedGuests,
      guestsResponded,
      notComingGuests,
      totalGuestsComing,
      totalGuestsNotComing,
      totalGuests,
      unconformedGuests,
    } = guestData;

    // HTML ELEMENTS
    const guestsTotalEl = document.getElementById("guestTotal");
    // CONFIRMED GUESTS
    const confirmedGuestsEl = document.getElementById("confirmedGuests");
    const confirmedGuestsTotalEl = document.getElementById(
      "confirmedGuestsTotal"
    );
    // NOT COMING GUESTS
    const notComingGuestsEl = document.getElementById("notComingGuests");
    const notComingGuestsTotalEl = document.getElementById(
      "notComingGuestsTotal"
    );
    // UNCONFIRMED GUESTS
    const unConfirmedGuestsEl = document.getElementById("unConfirmedGuests");
    const unConfirmedGuestsTotalEl = document.getElementById(
      "unConfirmedGuestsTotal"
    );

    //
    const guestElement = (category, guest) => {
      let categoryClass;

      if (category === "confirmed") {
        categoryClass = "bg-success-subtle border border-success";
      } else if (category === "notComing") {
        categoryClass = "bg-danger-subtle border border-danger";
      } else {
        categoryClass = "bg-info-subtle border border-info";
      }
      return `
            <li class="list-group-item ${categoryClass}">
              <div class="row text-start p-2">
                <p class="col m-0"><span class="fw-bold">Name: </span>${guest.name}</p>
                <p class="col m-0"><span class="fw-bold">Email: </span>${guest.email}</p>
                <p class="col m-0"><span class="fw-bold">Response Date: </span>${guest.response_date}</p>
              </div>
            </li>
          `;
    };
    // UPDATING TEXT CONTENT
    confirmedGuestsTotalEl.textContent = `: ${totalGuestsComing} guests`;
    guestsTotalEl.textContent = `: ${totalGuests} guests`;
    notComingGuestsTotalEl.textContent = `: ${totalGuestsNotComing} guests`;
    unConfirmedGuestsTotalEl.textContent = `: ${
      totalGuests - guestsResponded
    } guests`;
    // APPENDING GUESTS TO PAGE
    confirmedGuests.forEach((guest) => {
      confirmedGuestsEl.insertAdjacentHTML(
        "beforeend",
        guestElement("confirmed", guest)
      );
    });

    notComingGuests.forEach((guest) => {
      console.log(guest);
      notComingGuestsEl.insertAdjacentHTML(
        "beforeend",
        guestElement("notComing", guest)
      );
    });

    unconformedGuests.forEach((guest) => {
      unConfirmedGuestsEl.insertAdjacentHTML(
        "beforeend",
        guestElement("", guest)
      );
    });
  },
  fetchData: () => {
    fetch("/api/analytics?pwd=Bubbles5!")
      .then((data) => {
        return data.json();
      })
      .then((guestData) => {
        const { data } = guestData;
        app.populateGuests(data);
      })
      .catch((error) => {
        console.log(error);
      });
  },
};

app.fetchData();
